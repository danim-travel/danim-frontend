/**
 * DM(다이렉트 메시지) 도메인 타입.
 * REST: POST/GET /v1/direct-messages/conversations
 *       GET/DELETE /v1/direct-messages/conversations/{id}/messages
 * WS:   /ws/conversations/{conversation_id}/
 */

export interface UserBrief {
  user_id: string
  nickname: string
  profile_img: string | null
}

/** 대화 상대방·메시지 발신자에 공통으로 사용되는 유저 요약 타입. */
export type DmParticipant = UserBrief

export interface LastMessage {
  content: string | null
  img_url: string | null
  created_at: string
}

export interface Conversation {
  conversation_id: string
  opponent: DmParticipant
  last_message: LastMessage | null
  unread_count: number
}

export interface Message {
  message_id: string
  sender: UserBrief
  content: string | null
  img_url: string | null
  original_img: string | null
  is_deleted: boolean
  created_at: string
}

export interface CreateConversationRequest {
  receiver_id: string
}

export interface CreateConversationResponse {
  conversation_id: string
  opponent: DmParticipant
  created_at: string
}

export interface ConversationListResponse {
  results: Conversation[]
}

export interface MessageListResponse {
  next: string | null
  results: Message[]
}

export interface DmPresignedUrlResponse {
  presigned_url: string
  img_url: string
  key: string
}

/**
 * DM WebSocket 메시지 타입.
 * 클라이언트 → 서버: auth로 인증 후 send_message로 메시지 전송.
 * 서버 → 클라이언트: auth_success / receive_message / read_receipt / message_deleted / error.
 */
export type DmWsClientMessage =
  | { type: 'auth'; token: string }
  | { type: 'send_message'; conversation_id: string; content: string | null; img_url?: string | null }

export type DmWsServerMessage =
  | { type: 'auth_success' }
  | { type: 'receive_message'; message: Message }
  | { type: 'read_receipt'; conversation_id: string; message_id: string }
  | { type: 'message_deleted'; conversation_id: string; message_id: string }
  | { type: 'error'; detail: string }
