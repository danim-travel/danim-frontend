// PostDetail(GET 응답)을 작성 폼의 초기 상태(SpotFormData[] + thumbnailKey)로 변환한다.
import type { PostDetail } from '@/types'
import type { SpotFormData } from '../_types/write.types'

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
        key: img.key,
        // 크기 정보가 없으면 null 그대로 둔다. 0 같은 값을 지어내면 쓰기 검증(최솟값 1)에서
        // 원인을 알 수 없는 400이 난다. 실제 차단은 hasImageWithoutSize가 담당한다.
        width: img.width,
        height: img.height,
      })),
      previewUrls: sortedImages.map((img) => img.img_url),
    }
  })
}

// PostDetail.post.thumbnail (S3 URL) 기준으로 초기 썸네일 key를 찾는다.
export function findInitialThumbnailKey(detail: PostDetail): string | null {
  const thumbnailUrl = detail.post.thumbnail
  for (const spot of detail.spots) {
    for (const img of spot.images) {
      if (img.img_url === thumbnailUrl || img.original_img === thumbnailUrl) {
        return img.key
      }
    }
  }
  // fallback: 첫 번째 이미지
  return detail.spots[0]?.images[0]?.key ?? null
}
