/**
 * 실시간 알림 뱃지 WebSocket 구독 훅.
 *
 * - 로그인 상태에서만 동작한다.
 * - 마운트/재연결 시 `POST websocket-key`로 일회성 `socket_key`를 발급받아
 *   `wss://{wsBaseUrl}/ws/notifications?socket_key=<uuid>` 형태로 연결한다.
 * - 서버가 push하는 `{ unread_count }` 를 notificationBadgeStore에 반영한다.
 * - access_token이 갱신되면 기존 socket을 닫고 새 socket_key로 재연결한다.
 * - WS 비정상 종료 또는 socket_key 발급 실패 시 지수 백오프
 *   (1s → 2s → 4s → 8s → 16s → 최대 30s)로 재시도한다.
 * - 정상 close(코드 1000) 또는 로그아웃/언마운트 시 재연결하지 않고 정리한다.
 *
 * `(main)/layout.tsx` 등 로그인 영역의 단일 지점에서 1회 마운트하여 사용한다.
 */
'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { issueSocketKey } from '@/lib/api/websocket'
import { config } from '@/lib/config'
import { useAuthStore } from '@/store/authStore'
import { useNotificationBadgeStore } from '@/store/notificationBadgeStore'
import { queryKeys } from '@/lib/queryKeys'
import type { NotificationWsServerMessage } from '@/types/notification.types'

const NORMAL_CLOSE_CODE = 1000
const INITIAL_BACKOFF_MS = 1000
const MAX_BACKOFF_MS = 30_000

function isNotificationWsServerMessage(value: unknown): value is NotificationWsServerMessage {
  if (typeof value !== 'object' || value === null) return false
  const count = (value as { unread_count?: unknown }).unread_count
  return typeof count === 'number' && Number.isInteger(count) && count >= 0
}

export function useNotificationBadge(): void {
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((s) => s.accessToken)
  const setUnreadCount = useNotificationBadgeStore((s) => s.setUnreadCount)
  const resetUnreadCount = useNotificationBadgeStore((s) => s.reset)

  useEffect(() => {
    // 비로그인: 뱃지 카운트 초기화하고 종료
    if (!accessToken) {
      resetUnreadCount()
      return
    }

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

      // 탭이 백그라운드면 visible 복귀 시까지 연결 지연 — 불필요한 idle 소켓 절감
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        const onVisible = () => {
          if (document.visibilityState !== 'visible') return
          document.removeEventListener('visibilitychange', onVisible)
          if (cancelled) return
          void connect()
        }
        document.addEventListener('visibilitychange', onVisible)
        return
      }

      // 1) 일회성 socket_key 발급 (apiClient가 401 시 토큰 갱신 자동 처리)
      let socketKey: string
      try {
        const { socket_key } = await issueSocketKey()
        socketKey = socket_key
      } catch {
        scheduleReconnect()
        return
      }
      if (cancelled) return

      // 2) WS 연결 — URL 쿼리 파라미터로 인증
      const url = `${config.wsBaseUrl}/ws/notifications?socket_key=${encodeURIComponent(socketKey)}`
      try {
        socket = new WebSocket(url)
      } catch {
        scheduleReconnect()
        return
      }

      socket.onmessage = (event) => {
        const raw = typeof event.data === 'string' ? event.data : ''
        let parsed: unknown
        try {
          parsed = JSON.parse(raw)
        } catch {
          return
        }
        if (!isNotificationWsServerMessage(parsed)) return

        // 정상 데이터 수신 → 백오프 리셋
        backoffMs = INITIAL_BACKOFF_MS
        const prev = useNotificationBadgeStore.getState().unreadCount
        setUnreadCount(parsed.unread_count)
        // 새 알림이 생겼으면 목록 캐시 무효화 → 드로어 열 때 최신 목록 표시
        if (parsed.unread_count > prev) {
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list })
        }
      }

      socket.onclose = (event) => {
        if (cancelled) return
        // 정상 종료(1000)는 재연결하지 않는다.
        if (event.code === NORMAL_CLOSE_CODE) return
        scheduleReconnect()
      }

      socket.onerror = () => {
        // error 후에는 close가 이어지므로 여기서는 별도 처리 없음
      }
    }

    void connect()

    // 탭이 hidden되면 소켓 close, 다시 visible되면 재연결 (idle 소켓 절감)
    const handleVisibilityChange = () => {
      if (cancelled) return
      if (document.visibilityState === 'hidden') {
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
        }
        clearReconnectTimer()
      } else if (document.visibilityState === 'visible' && !socket) {
        backoffMs = INITIAL_BACKOFF_MS
        void connect()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearReconnectTimer()
      if (socket) {
        // 핸들러 분리 — onclose에서 재연결 트리거되는 것을 막는다.
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
      }
    }
  }, [accessToken, setUnreadCount, resetUnreadCount, queryClient])
}
