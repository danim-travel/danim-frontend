'use client'

import { apiClient } from '@/lib/apiClient'

export type PresignedUrlResponse = {
  presigned_url: string
  img_url: string
  key: string
}

export async function uploadImage(endpoint: string, file: File): Promise<PresignedUrlResponse> {
  const { presigned_url, img_url, key } = await apiClient
    .post(endpoint, { json: { original_img: file.name } })
    .json<PresignedUrlResponse>()

  const s3Res = await fetch(presigned_url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
  if (!s3Res.ok) throw new Error(`S3 upload failed: ${s3Res.status}`)

  return { presigned_url, img_url, key }
}
