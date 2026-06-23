'use client'

import { apiClient } from '@/lib/apiClient'
import { compressImage } from '@/lib/media/imageCompression'

type PresignedUrlApiResponse = {
  presigned_url: string
  img_url: string
  key: string
}

export type UploadResult = {
  img_url: string
  key: string
}

const UPLOAD_TIMEOUT_MS = 30_000

export async function uploadImage(endpoint: string, file: File): Promise<UploadResult> {
  const compressed = await compressImage(file)

  const { presigned_url, img_url, key } = await apiClient
    .post(endpoint, { json: { original_img: compressed.name } })
    .json<PresignedUrlApiResponse>()

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS)
  let s3Res: Response
  try {
    s3Res = await fetch(presigned_url, {
      method: 'PUT',
      body: compressed,
      headers: { 'Content-Type': compressed.type },
      signal: controller.signal,
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('이미지 업로드 시간이 초과되었습니다.')
    }
    throw e
  } finally {
    clearTimeout(timeoutId)
  }
  if (!s3Res.ok) throw new Error(`S3 upload failed: ${s3Res.status}`)

  return { img_url, key }
}
