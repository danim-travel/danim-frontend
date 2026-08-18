'use client'

import imageCompression from 'browser-image-compression'

/** 압축 결과가 이 값 이하라면 압축을 스킵한다. (작은 파일은 압축이 오히려 커질 수 있음) */
const SKIP_COMPRESSION_THRESHOLD = 500 * 1024 // 500KB

/** 압축이 부적절한 포맷 (벡터 또는 애니메이션). 원본 그대로 통과시킨다. */
const SKIP_MIME_TYPES = new Set<string>(['image/svg+xml', 'image/gif'])

/**
 * 라이브러리는 maxSizeMB를 "반복 재인코딩"으로 맞춘다. 목표치를 넘으면 캔버스를 통째로
 * 다시 그리고 다시 인코딩하기를 최대 10회 반복하므로, 목표에 못 닿을수록 그대로 시간이 된다.
 *
 * alwaysKeepResolution: 루프가 돌 때 라이브러리는 매 회 해상도를 5%씩 깎는다. 그대로 두면
 *   maxWidthOrHeight로 지정한 1920px이 아니라 그보다 한참 작은 이미지가 저장된다.
 *   이 옵션을 켜면 해상도는 유지하고 품질만 조정한다.
 *   (초기 1920px 리사이즈는 루프 이전 단계라 그대로 적용된다)
 *
 * maxIteration: 재인코딩 반복을 1회로 제한한다. PNG처럼 무손실 포맷은 인코딩 시 quality
 *   인자가 무시되어 아무리 반복해도 용량이 줄지 않는데, 기본값 10이면 그 헛돎을 10번 다 돈다.
 *   실측으로 1080x1920 PNG 한 장에 약 12초가 걸렸고 그중 대부분이 이 반복이었다.
 *   목표 용량을 못 맞추더라도 원본 포맷·해상도를 지키고 시간을 아끼는 쪽을 택한다.
 *   (0을 넣으면 라이브러리가 `maxIteration || 10`으로 읽어 기본값 10이 되므로 1이 최솟값이다)
 *
 * fileType은 일부러 지정하지 않는다. 지정하면 출력 포맷이 바뀌어 확장자까지 달라진다.
 * 압축은 포맷을 유지한 채 용량만 줄이는 것이 목적이다.
 */
const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  initialQuality: 0.8,
  alwaysKeepResolution: true,
  maxIteration: 1,
}

/**
 * 클라이언트에서 이미지를 자동 리사이즈/압축한다.
 * - 500KB 미만 파일은 그대로 반환
 * - HEIC는 라이브러리가 JPEG로 자동 변환
 * - EXIF 회전은 라이브러리 기본 동작에 위임
 *
 * 실패 시 caller 측 try/catch에서 처리.
 */
export async function compressImage(file: File): Promise<File> {
  // SVG는 벡터라 raster 압축 시 깨지고, GIF는 정적 1프레임으로 변환되므로 원본 유지
  if (SKIP_MIME_TYPES.has(file.type)) return file
  if (file.size < SKIP_COMPRESSION_THRESHOLD) return file

  return imageCompression(file, COMPRESSION_OPTIONS)
}
