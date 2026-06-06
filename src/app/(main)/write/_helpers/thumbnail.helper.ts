import type { CreatePostSpotImage } from '@/types'
import type { SpotFormData } from '../_types/write.types'

// 썸네일로 쓰던 사진 삭제 후 대체 썸네일 탐색
// 우선순위: 같은 스팟의 남은 첫 번째 사진 → 다른 스팟의 첫 번째 사진 → null
export function findFallbackThumbnail(
  spots: SpotFormData[],
  activeId: string,
  nextImages: CreatePostSpotImage[]
): string | null {
  return (
    nextImages[0]?.key ??
    // 현재 스팟은 제외하고 나머지 스팟 이미지 중 첫 번째
    spots.flatMap((s) => (s.id === activeId ? [] : s.images)).at(0)?.key ??
    null
  )
}
