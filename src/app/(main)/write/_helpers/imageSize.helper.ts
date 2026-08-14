// 이미지 크기 정보 유무를 판별한다.
// 게시글 쓰기 스키마가 width/height를 필수(최솟값 1, null 불가)로 요구하므로,
// 크기를 모르는 이미지는 요청에 담을 수 없다. 그 판정 기준을 한 곳에 둔다.
import type { PostDetail } from '@/types'

type MaybeSizedImage = { width: number | null; height: number | null }

/**
 * 크기 정보가 모두 유효하게 채워져 있는지 판별한다. 통과하면 width/height가 number로 좁혀진다.
 * null뿐 아니라 0·음수·NaN도 걸러낸다. 이 값들은 서버 응답에서 그대로 폼 상태로 흘러들어오는데,
 * 쓰기 스키마의 최솟값 1을 만족하지 못해 저장 시점에 원인 불명의 400이 된다.
 */
function isValidSize(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value >= 1
}

export function hasImageSize<T extends MaybeSizedImage>(
  img: T,
): img is T & { width: number; height: number } {
  return isValidSize(img.width) && isValidSize(img.height)
}

/**
 * 크기 정보가 없는 이미지를 가진 게시글인지 판별한다.
 * 이런 게시글은 수정 요청이 백엔드 검증을 통과할 수 없다.
 */
export function hasImageWithoutSize(detail: PostDetail): boolean {
  return detail.spots.some((spot) => spot.images.some((img) => !hasImageSize(img)))
}
