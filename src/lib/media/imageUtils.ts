/**
 * 마소너리 그리드 카드의 가로세로 비율(width / height).
 *
 * 파노라마·초세로 이미지는 카드 하나가 화면을 뒤덮거나 종잇장처럼 납작해지므로
 * 상·하한으로 잘라낸다. 잘려나간 만큼은 object-cover가 흡수한다.
 */
export const MIN_CARD_RATIO = 0.5 // 1:2 — 세로 한계
export const MAX_CARD_RATIO = 2 // 2:1 — 가로 한계

/**
 * 썸네일 크기를 모를 때 쓰는 비율(4:5).
 * 백엔드가 아직 크기를 내려주지 않는 화면(마이페이지 저장됨 탭)과
 * 크기가 기록되지 않은 레거시 게시글이 이 경로를 탄다.
 */
export const FALLBACK_CARD_RATIO = 0.8

/** 백엔드 모델이 null을 허용하므로(`null=True`) 0·음수·NaN까지 함께 걸러낸다. */
function isValidSize(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value) && value > 0
}

/**
 * 썸네일 크기로 카드 비율을 구한다.
 *
 * 렌더(aspect-ratio)와 컬럼 분배(높이 계산)가 **반드시 이 함수의 같은 결과를 공유**해야 한다.
 * 실측값으로 분배하고 클램프한 값으로 렌더하면 계산 높이와 실제 높이가 어긋나 컬럼 바닥이 안 맞는다.
 */
export function cardRatio(width: number | null, height: number | null): number {
  if (!isValidSize(width) || !isValidSize(height)) return FALLBACK_CARD_RATIO
  return Math.min(MAX_CARD_RATIO, Math.max(MIN_CARD_RATIO, width / height))
}
