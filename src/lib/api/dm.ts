'use client'

import { apiClient } from '@/lib/apiClient'
import { compressImage } from '@/lib/imageCompression'
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
  // C2: 빈 문자열 cursor도 유효 파라미터일 수 있으므로 null/undefined만 제외
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

/**
 * DM 이미지를 S3에 업로드한다.
 * C6: uploadImage와 동일하게 압축 → presigned URL 발급 → S3 PUT 순서로 진행한다.
 * WebSocket 전송에 필요한 img_url을 반환한다.
 */
export async function uploadDmImage(
  conversationId: string,
  file: File,
): Promise<DmPresignedUrlResponse> {
  // C6: 압축 후 파일명·타입이 바뀔 수 있으므로 압축본 기준으로 presigned URL 요청
  const compressed = await compressImage(file)
  const result = await getDmImagePresignedUrl(conversationId, compressed.name)
  const s3Res = await fetch(result.presigned_url, {
    method: 'PUT',
    body: compressed,
    // C7: file.type이 빈 문자열인 경우(알 수 없는 확장자) 폴백 적용
    headers: { 'Content-Type': compressed.type || 'application/octet-stream' },
  })
  if (!s3Res.ok) throw new Error(`S3 upload failed: ${s3Res.status}`)
  return result
}
