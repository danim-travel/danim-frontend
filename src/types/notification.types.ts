/**
 * 알림 도메인 타입.
 * GET/PATCH/DELETE /v1/notifications 응답 스펙을 따른다.
 */

export type TargetType = 'user' | 'post' | 'dm'

export type NotificationType =
  | 'follow'
  | 'comment'
  | 'comment_like'
  | 'post_like'
  | 'dm'

export interface NotificationSender {
  user_id: string
  nickname: string
  profile_img: string
}

export interface NotificationItem {
  notification_id: string
  message: string
  created_at: string
  target_type: TargetType
  target_id: string
  notification_type: NotificationType
  is_read: boolean
  sender: NotificationSender
}

export interface NotificationListResponse {
  next: string | null
  results: NotificationItem[]
}

/**
 * 알림 WebSocket 메시지 타입.
 * 클라이언트 → 서버: 연결 직후 access_token으로 인증한다.
 * 서버 → 클라이언트: 인증 성공 시 unread_count를 push, 실패 시 error.
 */
export type NotificationWsClientMessage =
  | { type: 'auth'; token: string }

export type NotificationWsServerMessage =
  | { type: 'unread_count'; count: number }
  | { type: 'error'; detail: string }

