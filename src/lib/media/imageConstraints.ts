import { createApiError } from '@/lib/apiError'

/**
 * 업로드 가능한 이미지 형식. **백엔드 화이트리스트와 1:1로 맞춰야 한다.**
 * (danim-backend `apps/core/storage/s3/constants.py` — `ALLOWED_EXTENSIONS`)
 *
 * 백엔드는 파일 내용이 아니라 **파일명 확장자**로 검사하고, 그 확장자로 presigned URL의
 * `content_type`을 정한다. 그래서 프론트도 MIME과 확장자를 함께 본다.
 */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

/** 댓글만 GIF를 추가로 허용한다 (`COMMENT_ALLOWED_EXTENSIONS`). */
export const ALLOWED_COMMENT_IMAGE_TYPES = [...ALLOWED_IMAGE_TYPES, 'image/gif'] as const

/**
 * `<input type="file" accept>` 값.
 *
 * `accept`는 **필터일 뿐 방어선이 아니다.** 드래그앤드롭으로 우회되고, 안드로이드는
 * 제조사별로 무시하는 경우가 있다. 실제 차단은 `assertUploadableImage`가 한다.
 */
export const IMAGE_ACCEPT = ALLOWED_IMAGE_TYPES.join(',')
export const COMMENT_IMAGE_ACCEPT = ALLOWED_COMMENT_IMAGE_TYPES.join(',')

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
const MAX_IMAGE_SIZE_LABEL = '5MB'

const EXTENSIONS_BY_TYPE: Record<string, readonly string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
}

const LABEL_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
  'image/gif': 'GIF',
}

function formatAllowed(allowed: readonly string[]): string {
  return allowed.map((type) => LABEL_BY_TYPE[type] ?? type).join(', ')
}

/**
 * 업로드할 수 없는 파일이면 사용자에게 보여줄 메시지를, 문제없으면 `null`을 반환한다.
 * 파일을 고른 직후 화면에서 바로 막을 때 쓴다.
 */
export function getImageFileError(
  file: File,
  allowed: readonly string[] = ALLOWED_IMAGE_TYPES,
): string | null {
  const label = formatAllowed(allowed)

  if (!allowed.includes(file.type)) {
    return `지원하지 않는 형식입니다. ${label} 파일을 올려주세요.`
  }

  // MIME만 믿을 수 없다. 일부 안드로이드 기기는 .heic를 image/jpeg로 신고하는데,
  // 백엔드는 확장자로 검사하므로 그대로 보내면 400이 떨어진다.
  const extensions = allowed.flatMap((type) => EXTENSIONS_BY_TYPE[type] ?? [])
  const name = file.name.toLowerCase()
  if (!extensions.some((ext) => name.endsWith(ext))) {
    return `파일 확장자가 ${label} 중 하나여야 합니다.`
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `파일 크기는 ${MAX_IMAGE_SIZE_LABEL} 이하여야 합니다.`
  }

  return null
}

/**
 * 업로드 직전 마지막 방어선. 문제가 있으면 `ApiError`로 던진다.
 *
 * 일반 `Error`로 던지면 `getApiErrorMessage`가 "서버 오류가 발생했습니다"로 덮어써서
 * 문구가 통째로 사라진다. 재시도해도 소용없는 실패인데 사용자는 계속 재시도하게 된다.
 */
export function assertUploadableImage(
  file: File,
  allowed: readonly string[] = ALLOWED_IMAGE_TYPES,
): void {
  const message = getImageFileError(file, allowed)
  if (!message) return
  // 415 Unsupported Media Type / 413 Payload Too Large — 어느 쪽이든 5xx가 아니라
  // getApiErrorMessage가 detail을 그대로 노출한다.
  throw createApiError(file.size > MAX_IMAGE_SIZE_BYTES ? 413 : 415, message)
}
