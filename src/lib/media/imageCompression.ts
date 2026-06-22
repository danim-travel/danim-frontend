'use client'

import imageCompression from 'browser-image-compression'

/** 압축 결과가 이 값 이하라면 압축을 스킵한다. (작은 파일은 압축이 오히려 커질 수 있음) */
const SKIP_COMPRESSION_THRESHOLD = 500 * 1024 // 500KB

/** 압축이 부적절한 포맷 (벡터 또는 애니메이션). 원본 그대로 통과시킨다. */
const SKIP_MIME_TYPES = new Set<string>(['image/svg+xml', 'image/gif'])

/** 1차 압축 후 이 값을 초과하면 2차 압축을 시도한다. */
const SECOND_PASS_THRESHOLD = 10 * 1024 * 1024 // 10MB

const FIRST_PASS_OPTIONS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  initialQuality: 0.8,
}

const SECOND_PASS_OPTIONS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1280,
  useWebWorker: true,
  initialQuality: 0.6,
}

/**
 * 클라이언트에서 이미지를 자동 리사이즈/압축한다.
 * - 500KB 미만 파일은 그대로 반환
 * - HEIC는 라이브러리가 JPEG로 자동 변환
 * - 1차 압축 결과가 10MB 초과면 2차 공격 압축 진행
 * - EXIF 회전은 라이브러리 기본 동작에 위임
 *
 * 실패 시 caller 측 try/catch에서 처리.
 */
export async function compressImage(file: File): Promise<File> {
  // SVG는 벡터라 raster 압축 시 깨지고, GIF는 정적 1프레임으로 변환되므로 원본 유지
  if (SKIP_MIME_TYPES.has(file.type)) return file
  if (file.size < SKIP_COMPRESSION_THRESHOLD) return file

  let compressed = await imageCompression(file, FIRST_PASS_OPTIONS)
  if (compressed.size > SECOND_PASS_THRESHOLD) {
    compressed = await imageCompression(compressed, SECOND_PASS_OPTIONS)
  }
  return compressed
}
