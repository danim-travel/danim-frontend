'use client'

import { uploadImage } from '@/lib/uploadImage'
import type { DmPresignedUrlResponse } from '@/types'

/**
 * DM 이미지를 S3에 업로드한다.
 * 압축 → presigned URL 발급 → S3 PUT 순서로 진행한다.
 * WebSocket 전송에 필요한 img_url을 반환한다.
 */
export async function uploadDmImage(
  conversationId: string,
  file: File,
): Promise<DmPresignedUrlResponse> {
  return uploadImage(`direct-messages/conversations/${conversationId}/messages/presigned-url`, file)
}
