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
 * 알림 WebSocket 서버 메시지 타입.
 * 인증은 WS URL의 `socket_key` 쿼리 파라미터로 처리되며, 서버는 연결 직후·이벤트 시점에
 * `{ unread_count }`만 push한다. 클라이언트는 메시지를 송신하지 않는다.
 */
export type NotificationWsServerMessage = { unread_count: number }

/** POST v1/websocket-key 응답 — 일회성 WS 인증 키 */
export interface SocketKeyResponse {
  socket_key: string
}

