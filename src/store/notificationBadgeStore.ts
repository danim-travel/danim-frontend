/**
 * 실시간 알림 미확인 개수 store.
 *
 * 서버 캐시가 아닌 "WebSocket으로 push되는 실시간 카운트"만 보관한다.
 * 단일 WS 구독 훅(useNotificationBadge)에서 set하고, SideNav 등 다수의 컴포넌트에서 구독한다.
 */
import { create } from 'zustand'

interface NotificationBadgeState {
  unreadCount: number
  setUnreadCount: (count: number) => void
  reset: () => void
}

export const useNotificationBadgeStore = create<NotificationBadgeState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  reset: () => set({ unreadCount: 0 }),
}))
