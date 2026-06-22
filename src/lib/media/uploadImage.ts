'use client'

import { apiClient } from '@/lib/apiClient'
import { compressImage } from '@/lib/media/imageCompression'

export type PresignedUrlResponse = {
  presigned_url: string
  img_url: string
  key: string
}

export async function uploadImage(endpoint: string, file: File): Promise<PresignedUrlResponse> {
  // 1. 클라이언트 압축 (직렬). HEIC → JPEG 자동 변환 케이스에서 파일명/타입이 바뀔 수 있어
  //    presigned URL과 S3 PUT 모두 압축 결과 기준으로 진행한다.
  const compressed = await compressImage(file)

  // 2. presigned URL 요청 — 압축본 파일명 기준
  const { presigned_url, img_url, key } = await apiClient
    .post(endpoint, { json: { original_img: compressed.name } })
    .json<PresignedUrlResponse>()

  // 3. S3 PUT — 압축본 업로드
  const s3Res = await fetch(presigned_url, {
    method: 'PUT',
    body: compressed,
    headers: { 'Content-Type': compressed.type },
  })
  if (!s3Res.ok) throw new Error(`S3 upload failed: ${s3Res.status}`)

  return { presigned_url, img_url, key }
}
