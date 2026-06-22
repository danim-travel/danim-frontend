// PostDetail(GET 응답)을 작성 폼의 초기 상태(SpotFormData[] + thumbnailKey)로 변환한다.
//
// TODO(FEAT-003): 백엔드 GET /posts/:postId 응답의 spots[].images[]에 S3 `key` 필드가 없다.
// PATCH 요청은 `key`를 포함해야 하므로, 백엔드 응답에 key가 추가되면 아래 image 매핑에서
// 자동으로 채워진다. 현재는 key가 누락되어 빈 문자열로 들어가며, 새로 업로드한 이미지만
// 정상적인 key를 가진다.
import type { PostDetail } from '@/types'
import type { SpotFormData } from '../_types/write.types'

// 백엔드 응답 형태가 확정되기 전까지 key 필드 누락을 견디기 위한 임시 타입.
type PostDetailImageMaybeKey = PostDetail['spots'][number]['images'][number] & { key?: string }

export function postDetailToSpotFormData(detail: PostDetail): SpotFormData[] {
  const sorted = [...detail.spots].sort((a, b) => a.order - b.order)
  return sorted.map((spot) => {
    const sortedImages = [...spot.images].sort((a, b) => a.img_order - b.img_order)
    return {
      id: spot.spot_id,
      location: {
        place_name: spot.location.place_name,
        address_name: spot.location.address_name,
        road_address_name: spot.location.road_address_name,
        x: spot.location.x,
        y: spot.location.y,
      },
      content: spot.content,
      images: sortedImages.map((img) => ({
        original_img: img.original_img,
        // TODO(FEAT-003): 백엔드 응답에 key 추가되면 자동 매핑
        key: (img as PostDetailImageMaybeKey).key ?? '',
      })),
      previewUrls: sortedImages.map((img) => img.img_url),
    }
  })
}

// PostDetail.post.thumbnail (S3 URL) 기준으로 초기 썸네일 key를 찾는다.
// key가 없는 임시 응답 단계에서는 결과적으로 ''가 될 수 있다.
export function findInitialThumbnailKey(detail: PostDetail): string | null {
  const thumbnailUrl = detail.post.thumbnail
  for (const spot of detail.spots) {
    for (const img of spot.images) {
      if (img.img_url === thumbnailUrl || img.original_img === thumbnailUrl) {
        const maybe = img as PostDetailImageMaybeKey
        return maybe.key ?? ''
      }
    }
  }
  // fallback: 첫 번째 이미지
  const first = detail.spots[0]?.images[0] as PostDetailImageMaybeKey | undefined
  return first?.key ?? null
}
