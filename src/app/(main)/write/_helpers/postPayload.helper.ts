// 폼 상태 데이터를 API 요청 형식(CreatePostRequest)으로 변환하는 헬퍼 함수
import type { CreatePostRequest, CreatePostSpot, CreatePostSpotImage } from '@/types'
import type { SpotFormData, SpotFormImage } from '../_types/write.types'
import { hasImageSize } from './imageSize.helper'

/**
 * 폼 이미지를 요청 형식으로 변환한다.
 * 크기 정보가 없는 이미지가 하나라도 있으면 그 이미지만 빼는 대신 null을 반환한다.
 * 조용히 제외하면 사용자가 올린 사진이 알림 없이 사라지기 때문이다.
 */
function toRequestImages(images: SpotFormImage[]): CreatePostSpotImage[] | null {
  const converted: CreatePostSpotImage[] = []
  for (const img of images) {
    if (!hasImageSize(img)) return null
    converted.push({
      original_img: img.original_img,
      key: img.key,
      width: img.width,
      height: img.height,
    })
  }
  return converted
}

/** 페이로드를 만들지 못한 사유. 호출부가 사유에 맞는 안내를 띄운다. */
export type BuildPostPayloadFailure = 'missing-location' | 'missing-image-size'

export type BuildPostPayloadResult =
  | { ok: true; payload: CreatePostRequest }
  | { ok: false; reason: BuildPostPayloadFailure }

/**
 * 폼 상태를 요청 페이로드로 변환한다.
 * 위치가 없는 스팟이나 크기 정보가 없는 이미지가 하나라도 있으면 실패로 반환한다.
 * 일부만 골라 보내면 사용자가 입력한 내용이 알림 없이 사라지므로, 요청 자체를 만들지 않는다.
 */
export function buildPostPayload({
  title,
  description,
  spots,
  thumbnailKey,
}: {
  title: string
  description: string
  spots: SpotFormData[]
  thumbnailKey: string
}): BuildPostPayloadResult {
  const requestSpots: CreatePostSpot[] = []
  for (const [i, spot] of spots.entries()) {
    if (spot.location === null) return { ok: false, reason: 'missing-location' }
    const images = toRequestImages(spot.images)
    if (images === null) return { ok: false, reason: 'missing-image-size' }
    requestSpots.push({
      order: i + 1,
      content: spot.content,
      location: spot.location,
      images,
    })
  }

  // 썸네일로 지정된 이미지의 실제 크기. 찾지 못하면 백엔드가 크기 없이 저장한다.
  const thumbnailImage = requestSpots
    .flatMap((s) => s.images)
    .find((img) => img.key === thumbnailKey)

  return {
    ok: true,
    payload: {
      title: title.trim(),
      description: description.trim(),
      thumbnail: thumbnailKey,
      thumbnail_width: thumbnailImage?.width ?? null,
      thumbnail_height: thumbnailImage?.height ?? null,
      spots: requestSpots,
    },
  }
}
