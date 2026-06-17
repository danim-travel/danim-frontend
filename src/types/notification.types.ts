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
