import { createApiError } from '@/lib/apiError'

/**
 * 업로드 가능한 이미지 형식. **백엔드 화이트리스트와 1:1로 맞춰야 한다.**
 * (danim-backend `apps/core/storage/s3/constants.py` — `ALLOWED_EXTENSIONS`)
 *
 * 백엔드는 파일 내용이 아니라 **파일명 확장자**로 검사하고, 그 확장자로 presigned URL의
 * `content_type`을 정한다. 그래서 프론트도 MIME과 확장자를 함께 본다.
 */
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

/** 댓글만 GIF를 추가로 허용한다 (`COMMENT_ALLOWED_EXTENSIONS`). */
const ALLOWED_COMMENT_IMAGE_TYPES = [...ALLOWED_IMAGE_TYPES, 'image/gif'] as const

const MB = 1024 * 1024

/**
 * 업로드 경로별 정책.
 *
 * 허용 형식과 크기 상한을 **한 객체로 묶는다.** 따로 넘기게 두면 한쪽만 전달하는 실수가
 * 난다(댓글에 GIF 허용만 넘기고 상한을 빠뜨리는 식).
 *
 * 상한은 **압축 전 원본 크기** 기준이다. 압축은 1MB를 목표로 하지만 그 전에 걸러지므로,
 * 상한이 낮으면 문제없이 줄어들 사진까지 거부된다. 요즘 폰 사진은 iPhone 3~6MB,
 * 안드로이드 고화소 8~15MB라 사진 업로드는 넉넉히 잡아야 한다.
 * 댓글은 성격이 다른 작은 첨부라 기존 5MB를 유지한다.
 */
export const IMAGE_POLICY = {
  /** 게시글 사진 · DM · 프로필 */
  photo: {
    types: ALLOWED_IMAGE_TYPES as readonly string[],
    maxBytes: 20 * MB,
    accept: ALLOWED_IMAGE_TYPES.join(','),
  },
  /** 댓글 첨부 (GIF 허용) */
  comment: {
    types: ALLOWED_COMMENT_IMAGE_TYPES as readonly string[],
    maxBytes: 5 * MB,
    accept: ALLOWED_COMMENT_IMAGE_TYPES.join(','),
  },
} as const

export type ImagePolicy = (typeof IMAGE_POLICY)[keyof typeof IMAGE_POLICY]

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

/** 안내 문구와 검증 메시지가 같은 값을 쓰도록 여기서 계산한다. */
export function formatMaxSize(policy: ImagePolicy): string {
  return `${Math.round(policy.maxBytes / MB)}MB`
}

/**
 * 업로드할 수 없는 파일이면 사용자에게 보여줄 메시지를, 문제없으면 `null`을 반환한다.
 * 파일을 고른 직후 화면에서 바로 막을 때 쓴다.
 */
export function getImageFileError(
  file: File,
  policy: ImagePolicy = IMAGE_POLICY.photo,
): string | null {
  const label = policy.types.map((type) => LABEL_BY_TYPE[type] ?? type).join(', ')

  if (!policy.types.includes(file.type)) {
    return `지원하지 않는 형식입니다. ${label} 파일을 올려주세요.`
  }

  // MIME만 믿을 수 없다. 일부 안드로이드 기기는 .heic를 image/jpeg로 신고하는데,
  // 백엔드는 확장자로 검사하므로 그대로 보내면 400이 떨어진다.
  const extensions = policy.types.flatMap((type) => EXTENSIONS_BY_TYPE[type] ?? [])
  const name = file.name.toLowerCase()
  if (!extensions.some((ext) => name.endsWith(ext))) {
    return `파일 확장자가 ${label} 중 하나여야 합니다.`
  }

  if (file.size > policy.maxBytes) {
    return `파일 크기는 ${formatMaxSize(policy)} 이하여야 합니다.`
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
  policy: ImagePolicy = IMAGE_POLICY.photo,
): void {
  const message = getImageFileError(file, policy)
  if (!message) return
  // 415 Unsupported Media Type / 413 Payload Too Large — 어느 쪽이든 5xx가 아니라
  // getApiErrorMessage가 detail을 그대로 노출한다.
  throw createApiError(file.size > policy.maxBytes ? 413 : 415, message)
}
