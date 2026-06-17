'use client'

import { compressImage } from '@/lib/imageCompression'
import type { DmPresignedUrlResponse } from '@/types'
import { getDmImagePresignedUrl } from './dm'

/**
 * DM 이미지를 S3에 업로드한다.
 * 압축 → presigned URL 발급 → S3 PUT 순서로 진행한다.
 * WebSocket 전송에 필요한 img_url을 반환한다.
 */
export async function uploadDmImage(
  conversationId: string,
  file: File,
): Promise<DmPresignedUrlResponse> {
  const compressed = await compressImage(file)
  const result = await getDmImagePresignedUrl(conversationId, compressed.name)
  const s3Res = await fetch(result.presigned_url, {
    method: 'PUT',
    body: compressed,
    headers: { 'Content-Type': compressed.type || 'application/octet-stream' },
  })
  if (!s3Res.ok) throw new Error(`S3 upload failed: ${s3Res.status}`)
  return result
}
