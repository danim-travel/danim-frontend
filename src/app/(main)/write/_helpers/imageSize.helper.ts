// 이미지 크기 정보 유무를 판별한다.
// 게시글 쓰기 스키마가 width/height를 필수(최솟값 1, null 불가)로 요구하므로,
// 크기를 모르는 이미지는 요청에 담을 수 없다. 그 판정 기준을 한 곳에 둔다.
import type { PostDetail } from '@/types'

type MaybeSizedImage = { width: number | null; height: number | null }

/** 크기 정보가 모두 채워져 있는지 판별한다. 통과하면 width/height가 number로 좁혀진다. */
export function hasImageSize<T extends MaybeSizedImage>(
  img: T,
): img is T & { width: number; height: number } {
  return img.width !== null && img.height !== null
}

/**
 * 크기 정보가 없는 이미지를 가진 게시글인지 판별한다.
 * 이런 게시글은 수정 요청이 백엔드 검증을 통과할 수 없다.
 */
export function hasImageWithoutSize(detail: PostDetail): boolean {
  return detail.spots.some((spot) => spot.images.some((img) => !hasImageSize(img)))
}
