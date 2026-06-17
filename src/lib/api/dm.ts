import { apiClient } from '@/lib/apiClient'
import type {
  Conversation,
  ConversationListResponse,
  CreateConversationResponse,
  MessageListResponse,
  DmPresignedUrlResponse,
} from '@/types'

const BASE = 'direct-messages/conversations'

/** 대화 목록을 조회한다. */
export async function getConversations(): Promise<Conversation[]> {
  const res = await apiClient.get(BASE).json<ConversationListResponse>()
  return res.results
}

/** 대화방을 생성한다. 이미 존재하면 기존 대화방을 반환한다. */
export async function createConversation(receiverId: string): Promise<CreateConversationResponse> {
  return apiClient
    .post(BASE, { json: { receiver_id: receiverId } })
    .json<CreateConversationResponse>()
}

/** 대화방에서 나간다. 204 No Content 응답이므로 body를 읽지 않는다. */
export async function leaveConversation(conversationId: string): Promise<void> {
  await apiClient.delete(`${BASE}/${conversationId}`)
}

/** 메시지 목록을 조회한다. cursor 기반 페이지네이션을 지원한다. */
export async function getMessages(
  conversationId: string,
  cursor?: string,
  pageSize = 20,
): Promise<MessageListResponse> {
  const searchParams: Record<string, string | number> = { page_size: pageSize }
  if (cursor != null) searchParams.cursor = cursor
  return apiClient
    .get(`${BASE}/${conversationId}/messages`, { searchParams })
    .json<MessageListResponse>()
}

/** 메시지를 삭제한다. 204 No Content 응답이므로 body를 읽지 않는다. */
export async function deleteMessage(
  conversationId: string,
  messageId: string,
): Promise<void> {
  await apiClient.delete(`${BASE}/${conversationId}/messages/${messageId}`)
}

/** DM 이미지 업로드용 S3 presigned URL을 발급한다. */
export async function getDmImagePresignedUrl(
  conversationId: string,
  fileName: string,
): Promise<DmPresignedUrlResponse> {
  return apiClient
    .post(`${BASE}/${conversationId}/messages/presigned-url`, { json: { original_img: fileName } })
    .json<DmPresignedUrlResponse>()
}
