export const MAX_SPOTS = 5
export const MAX_PHOTOS = 5
export const MAX_LOCATION_SEARCH_RESULTS = 8
export const LOCATION_SEARCH_DEBOUNCE_MS = 300
export const KAKAO_MAP_POLL_INTERVAL_MS = 500

/** 요청 페이로드를 만들지 못한 사유별 안내. 작성·수정 양쪽에서 쓴다. */
export const BUILD_PAYLOAD_ERROR_MESSAGE = {
  'missing-location': '위치를 선택하지 않은 장소가 있습니다.',
  'missing-image-size': '이미지 정보를 확인할 수 없습니다. 사진을 다시 올려주세요.',
} as const
