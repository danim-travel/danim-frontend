// 폼 상태 데이터를 API 요청 형식(CreatePostRequest)으로 변환하는 헬퍼 함수
import type { CreatePostRequest } from '@/types'
import type { SpotFormData } from '../_types/write.types'

export function buildPostPayload({
  title,
  spots,
  thumbnailKey,
}: {
  title: string
  spots: SpotFormData[]
  thumbnailKey: string
}): CreatePostRequest {
  // 위치 미설정 스팟은 제출 대상에서 제외
  const validSpots = spots.filter((s) => s.location !== null)
  return {
    title: title.trim(),
    thumbnail: thumbnailKey,
    spots: validSpots.map((s, i) => ({
      order: i + 1,
      content: s.content,
      location: s.location!,
      images: s.images,
    })),
  }
}
