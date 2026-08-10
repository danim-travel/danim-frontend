'use client'

import { apiClient } from '@/lib/apiClient'
import { createApiError } from '@/lib/apiError'
import { compressImage } from '@/lib/media/imageCompression'

type PresignedUrlApiResponse = {
  presigned_url: string
  img_url: string
  key: string
}

export type UploadResult = {
  img_url: string
  key: string
  width: number
  height: number
}

const UPLOAD_TIMEOUT_MS = 30_000

/**
 * Blob(압축본)의 실제 픽셀 크기를 측정한다.
 * 백엔드가 width/height를 최솟값 1로 요구하므로, 측정에 실패하거나 0이 나오면
 * 잘못된 값을 보내는 대신 업로드를 중단시킨다.
 */
async function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  // ApiError로 던져야 getApiErrorMessage가 이 문구를 그대로 노출한다.
  // 일반 Error로 던지면 네트워크 오류로 간주되어 "서버 오류... 잠시 후 다시 시도"가 대신 뜨고,
  // 재시도해도 소용없는 실패인데 사용자는 계속 재시도하게 된다.
  const unreadable = createApiError(
    422,
    '이미지 크기를 확인할 수 없는 파일입니다. 다른 사진을 선택해주세요.',
  )
  const objectUrl = URL.createObjectURL(blob)
  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(unreadable)
      img.src = objectUrl
    })
    // 크기 정보가 없는 SVG 등은 naturalWidth가 0으로 측정된다
    if (img.naturalWidth < 1 || img.naturalHeight < 1) {
      throw unreadable
    }
    return { width: img.naturalWidth, height: img.naturalHeight }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export async function uploadImage(endpoint: string, file: File): Promise<UploadResult> {
  const compressed = await compressImage(file)

  // S3에 실제 올라가는 압축본 기준으로 크기 측정 (표시 이미지와 일치)
  const { width, height } = await getImageDimensions(compressed)

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

  return { img_url, key, width, height }
}
