/**
 * 알림 뱃지 WebSocket 구독을 (main) 레이아웃에서 1회 마운트하기 위한 마운트 전용 컴포넌트.
 * 렌더링 결과는 없다.
 */
'use client'

import { useNotificationBadge } from '@/app/(main)/_hooks/useNotificationBadge'

export function NotificationBadgeSocket() {
  useNotificationBadge()
  return null
}
