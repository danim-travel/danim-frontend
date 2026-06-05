// ─── 쇼케이스 환경 설정 ───────────────────────────────────────────────────────
// showcase 환경에서 인증 없이 댓글 소유자 판별에 사용하는 폴백 ID
export const SHOWCASE_MOCK_USER_ID = '01KSSJE3FZQ0G042AS5J7AJVK6'

// ─── 레이아웃 수치 ────────────────────────────────────────────────────────────
// 댓글 목록 영역의 고정 높이(px). 디자인 픽셀이 확정될 때까지 임시값.
export const COMMENT_LIST_HEIGHT_PX = 190

// 댓글 케밥 메뉴 높이(px). 수정/삭제 버튼 2개 × 32px + 패딩.
export const COMMENT_MENU_HEIGHT_PX = 80

// SpotContent 최대 노출 줄 수. useLayoutEffect에서 max-height 계산에 사용.
export const SPOT_CONTENT_CLAMP_LINES = 6
