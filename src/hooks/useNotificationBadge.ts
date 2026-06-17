/**
 * 실시간 알림 뱃지 WebSocket 구독 훅.
 *
 * - 로그인 상태에서만 `wss://{wsBaseUrl}/ws/notifications/`에 연결한다.
 * - 연결 직후 `{type:'auth', token}` 메시지로 access_token을 전송한다.
 * - 서버가 push하는 `{type:'unread_count', count}` 를 notificationBadgeStore에 반영한다.
 * - access_token이 갱신되면 기존 socket을 닫고 새 토큰으로 재연결한다.
 * - 비정상 종료 시 지수 백오프(1s → 2s → 4s → 8s → 16s → 최대 30s)로 재연결한다.
 * - 정상 close(코드 1000) 또는 로그아웃/언마운트 시 재연결하지 않고 정리한다.
 *
 * `(main)/layout.tsx` 등 로그인 영역의 단일 지점에서 1회 마운트하여 사용한다.
 */
'use client'

import { useEffect } from 'react'
import { config } from '@/lib/config'
import { useAuthStore } from '@/store/authStore'
import { useNotificationBadgeStore } from '@/store/notificationBadgeStore'
import type {
  NotificationWsClientMessage,
  NotificationWsServerMessage,
} from '@/types/notification.types'

const NORMAL_CLOSE_CODE = 1000
const INITIAL_BACKOFF_MS = 1000
const MAX_BACKOFF_MS = 30_000

function isNotificationWsServerMessage(value: unknown): value is NotificationWsServerMessage {
  if (typeof value !== 'object' || value === null) return false
  const v = value as { type?: unknown }
  if (v.type === 'unread_count') {
    const count = (value as { count?: unknown }).count
    return typeof count === 'number' && Number.isInteger(count) && count >= 0
  }
  if (v.type === 'error') {
    return typeof (value as { detail?: unknown }).detail === 'string'
  }
  return false
}

export function useNotificationBadge(): void {
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

    const url = `${config.wsBaseUrl}/ws/notifications/`

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
      try {
        socket = new WebSocket(url)
      } catch {
        scheduleReconnect()
        return
      }

      socket.onopen = () => {
        // 연결 성공 → access_token으로 인증 메시지 전송
        const authMessage: NotificationWsClientMessage = { type: 'auth', token: accessToken }
        socket?.send(JSON.stringify(authMessage))
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

        if (parsed.type === 'unread_count') {
          // 정상 데이터 수신 → 백오프 리셋
          backoffMs = INITIAL_BACKOFF_MS
          setUnreadCount(parsed.count)
          return
        }
        // type === 'error' — 서버가 곧 close하므로 별도 액션 없음
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

    connect()

    return () => {
      cancelled = true
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
  }, [accessToken, setUnreadCount, resetUnreadCount])
}
