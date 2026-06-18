'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { config } from '@/lib/config'
import { queryKeys } from '@/lib/queryKeys'
import type { MessageListResponse, DmWsClientMessage, DmWsServerMessage } from '@/types'

const NORMAL_CLOSE_CODE = 1000
const INITIAL_BACKOFF_MS = 1000
const MAX_BACKOFF_MS = 30_000

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

export function useDmSocket(conversationId: string, accessToken: string | null) {
  const queryClient = useQueryClient()
  const socketRef = useRef<WebSocket | null>(null)
  const isAuthedRef = useRef(false)

  useEffect(() => {
    if (!accessToken || !conversationId) return

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
        connect()
      }, delay)
    }

    const connect = () => {
      if (cancelled) return
      isAuthedRef.current = false
      try {
        socket = new WebSocket(`${config.wsBaseUrl}/ws/dm`)
        socketRef.current = socket
      } catch {
        scheduleReconnect()
        return
      }

      socket.onopen = () => {
        socket?.send(JSON.stringify({ type: 'auth', token: accessToken } satisfies DmWsClientMessage))
        isAuthedRef.current = true
        backoffMs = INITIAL_BACKOFF_MS
      }

      socket.onmessage = (event) => {
        const raw = typeof event.data === 'string' ? event.data : ''
        let parsed: unknown
        try {
          parsed = JSON.parse(raw)
        } catch {
          return
        }
        if (!isDmWsServerMessage(parsed)) return

        if (parsed.type === 'receive_message') {
          const { message } = parsed
          // 새 메시지를 최신 페이지 앞에 삽입 — MessageList가 역순 변환해 화면 하단에 표시
          queryClient.setQueryData<InfiniteData<MessageListResponse>>(
            queryKeys.dm.messages(conversationId),
            (old) => {
              if (!old) return old
              const [first, ...rest] = old.pages
              return {
                ...old,
                pages: [{ ...first, results: [message, ...first.results] }, ...rest],
              }
            }
          )
          queryClient.invalidateQueries({ queryKey: queryKeys.dm.conversations })
        }
      }

      socket.onclose = (event) => {
        isAuthedRef.current = false
        if (cancelled || event.code === NORMAL_CLOSE_CODE) return
        scheduleReconnect()
      }

      socket.onerror = () => {
        // error 이후 onclose가 이어지므로 별도 처리 없음
      }
    }

    connect()

    return () => {
      cancelled = true
      isAuthedRef.current = false
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
    (content: string) => {
      const socket = socketRef.current
      if (!socket || socket.readyState !== WebSocket.OPEN || !isAuthedRef.current) return
      socket.send(
        JSON.stringify({
          type: 'send_message',
          conversation_id: conversationId,
          content,
        } satisfies DmWsClientMessage)
      )
    },
    [conversationId]
  )

  return { sendMessage }
}
