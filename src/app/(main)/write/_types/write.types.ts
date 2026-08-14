import type { CreatePostSpotLocation } from '@/types'

/**
 * 폼이 들고 있는 이미지. 요청 타입(CreatePostSpotImage)과 달리 width/height가 null일 수 있다.
 * 기존 게시글을 수정할 때 백엔드가 크기 정보 없이 내려주는 경우가 있기 때문이며,
 * 제출 직전 buildPostPayload에서 걸러진다.
 */
export type SpotFormImage = {
  original_img: string
  key: string
  width: number | null
  height: number | null
}

export type SpotFormData = {
  id: string
  location: CreatePostSpotLocation | null
  content: string
  images: SpotFormImage[]
  previewUrls: string[]
}
