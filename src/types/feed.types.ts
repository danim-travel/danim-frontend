/**
 * 메인 페이지(/) 팔로잉 피드 관련 타입.
 * API: GET /api/v1/posts/main
 */

export interface FeedSpot {
  x: number // 경도(longitude)
  y: number // 위도(latitude)
}

export interface FeedPost {
  user: {
    user_id: string
    nickname: string
    profile_img: string | null
  }
  post: {
    post_id: string
    title: string
    thumbnail: string | null
    /** 썸네일 이미지를 가진 스팟의 content */
    content: string
    /** 썸네일 스팟의 address_name — 지역명 추출용 */
    address_name: string
    spot_count: number
  }
  comment_count: number
  is_liked: boolean
  like_count: number
  is_bookmarked: boolean
  /** 지도 마커용 좌표 목록 — 백엔드 추가 요청 중 */
  spots?: FeedSpot[]
}
