'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { config } from '@/lib/config'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/store/authStore'
import { issueSocketKey } from '@/lib/api/websocket'
import type { Message, MessageListResponse, DmWsClientMessage, DmWsServerMessage } from '@/types'

const NORMAL_CLOSE_CODE = 1000
const INITIAL_BACKOFF_MS = 1000
const MAX_BACKOFF_MS = 30_000
const PENDING_TTL_MS = 10_000
const MOCK_CONVERSATION_ID_PATTERN = /^(mock_|01HDMCONV)/i

function isDmWsServerMessage(value: unknown): value is DmWsServerMessage {
  if (typeof value !== 'object' || value === null) return false
  const v = value as { type?: unknown }
  return (
    v.type === 'receive_message' ||
    v.type === 'read_receipt' ||
    v.type === 'message_deleted' ||
    v.type === 'error'
  )
}

function isMockConversationId(conversationId: string) {
  return MOCK_CONVERSATION_ID_PATTERN.test(conversationId)
}

function isMockAccessToken(accessToken: string) {
  return accessToken.toLowerCase().includes('mock')
}

function prependToCache(
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId: string,
  message: Message
) {
  queryClient.setQueryData<InfiniteData<MessageListResponse>>(
    queryKeys.dm.messages(conversationId),
    (old) => {
      if (!old || old.pages.length === 0) return old
      // Bug 2 fix: 동일 message_id 중복 삽입 방지
      // (Strict Mode 이중 연결로 동일 echo가 두 번 수신될 때 두 번째를 차단)
      if (old.pages.some(page => page.results.some(m => m.message_id === message.message_id))) return old
      const [first, ...rest] = old.pages
      return {
        ...old,
        pages: [{ ...first, results: [message, ...first.results] }, ...rest],
      }
    }
  )
}

function replaceInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId: string,
  tempId: string,
  realMessage: Message
) {
  queryClient.setQueryData<InfiniteData<MessageListResponse>>(
    queryKeys.dm.messages(conversationId),
    (old) => {
      if (!old || old.pages.length === 0) return old
      return {
        ...old,
        pages: old.pages.map(page => ({
          ...page,
          // Bug 1 fix: sender를 낙관적 메시지 것으로 유지 → isMine(sender.user_id === myUserId) 보존
          // MSW mock은 sender를 SHOWCASE_MOCK_USER_ID로 설정하므로 교체 시 isMine이 false로 바뀌는 문제 방지
          results: page.results.map(m =>
            m.message_id === tempId ? { ...realMessage, sender: m.sender } : m
          ),
        })),
      }
    }
  )
}

// FIX 4: send 실패 시 낙관적 메시지 롤백용
function removeFromCache(
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId: string,
  messageId: string
) {
  queryClient.setQueryData<InfiniteData<MessageListResponse>>(
    queryKeys.dm.messages(conversationId),
    (old) => {
      if (!old || old.pages.length === 0) return old
      return {
        ...old,
        pages: old.pages.map(page => ({
          ...page,
          results: page.results.filter(m => m.message_id !== messageId),
        })),
      }
    }
  )
}

// FIX 2: tempId 추가 — echo 도착 시 해당 낙관적 항목을 정확히 교체하기 위함
interface PendingEntry {
  tempId: string
  content: string | null
  imgUrl: string | null
  sentAt: number
}

export function useDmSocket(
  conversationId: string,
  myUserId: string | null
) {
  const queryClient = useQueryClient()
  const accessToken = useAuthStore(s => s.accessToken)
  const socketRef = useRef<WebSocket | null>(null)
  const pendingRef = useRef<PendingEntry[]>([])
  const skippedSocketWarningRef = useRef<string | null>(null)
  const isMockModeRef = useRef(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!accessToken || !conversationId) {
      return
    }

    if (isMockConversationId(conversationId) || isMockAccessToken(accessToken)) {
      const warningKey = `${conversationId}:${accessToken}`
      if (skippedSocketWarningRef.current !== warningKey) {
        console.warn(
          `[DM WebSocket] Mock DM data detected. Skip dev WebSocket connection for conversation_id="${conversationId}".`
        )
        skippedSocketWarningRef.current = warningKey
      }
      // mock 모드: 소켓 없이 UI 활성화 — sendMessage가 낙관적 삽입으로 동작
      isMockModeRef.current = true
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsReady(true)
      return () => {
        isMockModeRef.current = false
        setIsReady(false)
      }
    }
    isMockModeRef.current = false

    let socket: WebSocket | null = null
    let reconnectTimerId: ReturnType<typeof setTimeout> | null = null
    let backoffMs = INITIAL_BACKOFF_MS
    let cancelled = false

    const clearReconnectTimer = () => {
      if (reconnectTimerId !== null) {
        clearTimeout(reconnectTimerId)
        reconnectTimerId = null
      }
    }

    const scheduleReconnect = () => {
      if (cancelled) return
      clearReconnectTimer()
      const delay = backoffMs
      backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS)
      reconnectTimerId = setTimeout(() => {
        if (cancelled) return
        void connect()
      }, delay)
    }

    const connect = async () => {
      if (cancelled) return
      // FIX 3: 재연결 시 stale 항목 초기화 — 끊김 후 동일 내용 재전송 시 오탐 방지
      pendingRef.current = []

      // Issue one-time socket_key
      let socketKey: string
      try {
        const { socket_key } = await issueSocketKey()
        socketKey = socket_key
      } catch {
        console.warn('[DM WebSocket] socket_key 발급 실패, 재연결 예약')
        scheduleReconnect()
        return
      }
      if (cancelled) return

      const wsUrl = `${config.wsBaseUrl}/ws/conversations/${conversationId}?socket_key=${encodeURIComponent(socketKey)}`
      try {
        console.info(`[DM WebSocket] connecting: ${config.wsBaseUrl}/ws/conversations/${conversationId}`)
        socket = new WebSocket(wsUrl)
        socketRef.current = socket
      } catch {
        console.error('[DM WebSocket] connect failed before opening')
        scheduleReconnect()
        return
      }

      socket.onopen = () => {
        console.info('[DM WebSocket] open')
        setIsReady(true)
        backoffMs = INITIAL_BACKOFF_MS
      }

      socket.onmessage = (event) => {
        const raw = typeof event.data === 'string' ? event.data : ''
        let parsed: unknown
        try {
          parsed = JSON.parse(raw)
        } catch {
          console.warn('[DM WebSocket] message parse failed')
          return
        }
        if (!isDmWsServerMessage(parsed)) return
        console.info(`[DM WebSocket] message: ${parsed.type}`)

        if (parsed.type === 'error') {
          console.error('[DM WebSocket] server error', parsed.detail)
          return
        }

        if (parsed.type === 'receive_message') {
          const { message } = parsed
          const now = Date.now()

          // FIX 6: null content는 매칭 제외 — 이미지 메시지에서 null===null 오탐 방지
          const pendingIdx = pendingRef.current.findIndex(
            p =>
              now - p.sentAt < PENDING_TTL_MS &&
              ((message.content !== null && p.content === message.content) ||
                (message.img_url !== null && p.imgUrl === message.img_url))
          )

          if (pendingIdx !== -1) {
            const { tempId } = pendingRef.current[pendingIdx]
            pendingRef.current.splice(pendingIdx, 1)
            // FIX 2: echo 스킵 대신 낙관적 메시지를 실제 서버 메시지로 교체
            replaceInCache(queryClient, conversationId, tempId, message)
            queryClient.invalidateQueries({ queryKey: queryKeys.dm.conversations, exact: true })
            return
          }

          // 상대방 메시지 → 캐시에 추가
          prependToCache(queryClient, conversationId, message)
          queryClient.invalidateQueries({ queryKey: queryKeys.dm.conversations, exact: true })
        }

        if (parsed.type === 'message_deleted') {
          queryClient.setQueryData<InfiniteData<MessageListResponse>>(
            queryKeys.dm.messages(conversationId),
            (old) => {
              if (!old || old.pages.length === 0) return old
              return {
                ...old,
                pages: old.pages.map(page => ({
                  ...page,
                  results: page.results.map(m =>
                    m.message_id === parsed.message_id ? { ...m, is_deleted: true } : m
                  ),
                })),
              }
            }
          )
          queryClient.invalidateQueries({ queryKey: queryKeys.dm.conversations, exact: true })
        }

        if (parsed.type === 'read_receipt') {
          // Message 타입에 읽음 필드 없음 → messages 캐시 변경 불가
          // conversations의 unread_count 갱신으로 읽음 상태 반영
          queryClient.invalidateQueries({ queryKey: queryKeys.dm.conversations, exact: true })
        }
      }

      socket.onclose = (event) => {
        setIsReady(false)
        console.info(
          `[DM WebSocket] close: code=${event.code} reason="${event.reason}" wasClean=${event.wasClean}`
        )
        if (cancelled || event.code === NORMAL_CLOSE_CODE) return
        scheduleReconnect()
      }

      socket.onerror = (event) => {
        console.error('[DM WebSocket] error', {
          event,
          readyState: socket?.readyState,
          conversationId,
          hasAccessToken: Boolean(accessToken),
        })
        // error 이후 onclose가 이어지므로 별도 처리 없음
      }
    }

    void connect()

    return () => {
      cancelled = true
      setIsReady(false)
      // FIX 3: 언마운트 시 pending 항목 초기화
      pendingRef.current = []
      clearReconnectTimer()
      if (socket) {
        socket.onopen = null
        socket.onmessage = null
        socket.onerror = null
        socket.onclose = null
        if (
          socket.readyState === WebSocket.OPEN ||
          socket.readyState === WebSocket.CONNECTING
        ) {
          socket.close(NORMAL_CLOSE_CODE)
        }
        socket = null
        socketRef.current = null
      }
    }
  }, [accessToken, conversationId, queryClient])

  const sendMessage = useCallback(
    (content: string, imgUrl?: string) => {
      if (!myUserId) return false

      const trimmed = content.trim()
      const normalizedContent = trimmed || null
      const normalizedImgUrl = imgUrl ?? null
      if (!normalizedContent && !normalizedImgUrl) return false

      // mock 모드: 소켓 없이 낙관적 삽입만 수행
      if (isMockModeRef.current) {
        const tempId = `opt-${Date.now()}-${Math.random().toString(36).slice(2)}`
        prependToCache(queryClient, conversationId, {
          message_id: tempId,
          sender: { user_id: myUserId, nickname: '', profile_img: null },
          content: normalizedContent,
          img_url: normalizedImgUrl,
          original_img: null,
          is_deleted: false,
          created_at: new Date().toISOString(),
        })
        queryClient.invalidateQueries({ queryKey: queryKeys.dm.conversations, exact: true })
        return true
      }

      const socket = socketRef.current
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.warn('[DM WebSocket] send skipped: socket is not ready', {
          readyState: socket?.readyState,
          conversationId,
        })
        return false
      }

      const tempId = `opt-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const optimistic: Message = {
        message_id: tempId,
        sender: { user_id: myUserId, nickname: '', profile_img: null },
        content: normalizedContent,
        img_url: normalizedImgUrl,
        original_img: null,
        is_deleted: false,
        created_at: new Date().toISOString(),
      }

      prependToCache(queryClient, conversationId, optimistic)
      pendingRef.current.push({ tempId, content: normalizedContent, imgUrl: normalizedImgUrl, sentAt: Date.now() })

      // FIX 4: send 실패 시 낙관적 메시지 롤백
      try {
        const payload: DmWsClientMessage = normalizedImgUrl
          ? {
              type: 'send_message',
              conversation_id: conversationId,
              content: normalizedContent,
              img_url: normalizedImgUrl,
            }
          : {
              type: 'send_message',
              conversation_id: conversationId,
              content: normalizedContent ?? '',
            }

        socket.send(
          JSON.stringify(payload)
        )
        return true
      } catch {
        removeFromCache(queryClient, conversationId, tempId)
        pendingRef.current.pop()
        return false
      }
    },
    [conversationId, myUserId, queryClient]
  )

  return { sendMessage, isReady }
}
