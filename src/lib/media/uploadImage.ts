'use client'

import { apiClient } from '@/lib/apiClient'
import { createApiError } from '@/lib/apiError'
import { compressImage } from '@/lib/media/imageCompression'
import { assertUploadableImage, IMAGE_POLICY, type ImagePolicy } from '@/lib/media/imageConstraints'

type PresignedUrlApiResponse = {
  presigned_url: string
  img_url: string
  key: string
}

export type UploadResult = {
  img_url: string
  key: string
}

/** 업로드 결과에 압축본의 실제 픽셀 크기가 포함된 형태. */
export type SizedUploadResult = UploadResult & {
  width: number
  height: number
}

const UPLOAD_TIMEOUT_MS = 30_000

/**
 * Blob(압축본)의 실제 픽셀 크기를 측정한다.
 * 게시글 스키마가 width/height를 최솟값 1로 요구하므로, 측정에 실패하거나 0이 나오면
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

function requestPresignedUrl(endpoint: string, fileName: string): Promise<PresignedUrlApiResponse> {
  return apiClient.post(endpoint, { json: { original_img: fileName } }).json<PresignedUrlApiResponse>()
}

async function putToS3(presignedUrl: string, blob: Blob): Promise<void> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS)
  let s3Res: Response
  try {
    s3Res = await fetch(presignedUrl, {
      method: 'PUT',
      body: blob,
      headers: { 'Content-Type': blob.type },
      signal: controller.signal,
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      // ApiError로 던져야 이 문구가 그대로 노출된다. 일반 Error면 getApiErrorMessage가
      // "서버 오류"로 덮어써, 30초를 기다린 사용자에게 원인과 다른 안내가 나간다.
      throw createApiError(408, '이미지 업로드 시간이 초과되었습니다. 네트워크 상태를 확인해주세요.')
    }
    throw e
  } finally {
    clearTimeout(timeoutId)
  }
  // 상태 코드를 살려 던진다. 5xx는 getApiErrorMessage가 공통 서버 오류 문구로 바꾸고,
  // 403(서명 불일치)처럼 재시도가 무의미한 경우는 아래 문구가 그대로 보인다.
  if (!s3Res.ok) {
    throw createApiError(s3Res.status, `이미지 저장에 실패했습니다. (${s3Res.status})`)
  }
}

/**
 * 이미지를 압축해 S3에 업로드한다.
 * 크기를 측정하지 않으므로, 크기 정보가 없는 이미지도 업로드에 성공한다.
 * 프로필·댓글·DM처럼 이미지 크기를 저장하지 않는 곳에서 사용한다.
 */
export async function uploadImage(
  endpoint: string,
  file: File,
  policy: ImagePolicy = IMAGE_POLICY.photo,
): Promise<UploadResult> {
  // accept는 드래그앤드롭으로 우회되고 일부 안드로이드는 무시한다. 여기가 마지막 방어선.
  assertUploadableImage(file, policy)
  const compressed = await compressImage(file)
  const { presigned_url, img_url, key } = await requestPresignedUrl(endpoint, compressed.name)
  await putToS3(presigned_url, compressed)
  return { img_url, key }
}

/**
 * 업로드와 함께 압축본의 실제 픽셀 크기도 반환한다.
 * 게시글은 백엔드가 width/height를 필수로 요구하므로 이 함수를 사용한다.
 * 크기 측정과 presigned URL 발급은 서로 의존하지 않으므로 동시에 진행한다.
 * 크기는 S3에 실제 올라가는 압축본 기준으로 재야 표시 이미지와 일치한다.
 */
export async function uploadImageWithSize(
  endpoint: string,
  file: File,
  policy: ImagePolicy = IMAGE_POLICY.photo,
): Promise<SizedUploadResult> {
  assertUploadableImage(file, policy)
  const compressed = await compressImage(file)
  const [{ width, height }, { presigned_url, img_url, key }] = await Promise.all([
    getImageDimensions(compressed),
    requestPresignedUrl(endpoint, compressed.name),
  ])
  await putToS3(presigned_url, compressed)
  return { img_url, key, width, height }
}
