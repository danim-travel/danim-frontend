export type PostImage = {
  img_url: string
  original_img: string
  img_order: number
  key: string
  width: number | null
  height: number | null
}

export type SpotLocation = {
  place_name: string
  address_name: string
  road_address_name: string
  x: string
  y: string
}

export type Spot = {
  spot_id: string
  location: SpotLocation
  images: PostImage[]
  content: string
  order: number
}

export type PostDetail = {
  post: {
    post_id: string
    title: string
    description: string
    thumbnail: string
    thumbnail_width: number | null
    thumbnail_height: number | null
    created_at: string
    updated_at: string
  }
  user: {
    user_id: string
    nickname: string
    profile_img: string
  }
  spots: Spot[]
  like_count: number
  is_liked: boolean
  comment_count: number
  is_bookmarked: boolean
  is_owner: boolean
}

// TODO: 지도 기능 구현 시 실제 API 스펙으로 교체
export type Post = {
  post_id: string
  color: string
  pins: { lat: number; lng: number; label: string; body: string }[]
}

// 게시글 작성 요청 타입
export type CreatePostSpotLocation = {
  place_name: string
  address_name: string
  road_address_name: string
  x: string // 카카오맵 API가 string으로 반환
  y: string
}

export type CreatePostSpotImage = {
  original_img: string
  key: string // S3 key
  width: number // 업로드된 이미지의 실제 픽셀 너비 (필수, 최솟값 1)
  height: number // 업로드된 이미지의 실제 픽셀 높이 (필수, 최솟값 1)
}

export type CreatePostSpot = {
  order: number
  content: string
  location: CreatePostSpotLocation
  images: CreatePostSpotImage[]
}

export type CreatePostRequest = {
  title: string
  description: string
  thumbnail: string
  // 썸네일 이미지의 실제 픽셀 크기 (선택, 최솟값 1, null 허용)
  thumbnail_width: number | null
  thumbnail_height: number | null
  spots: CreatePostSpot[]
}

// presigned URL 타입
export type PostPresignedUrlRequest = {
  original_img: string
}

export type PostPresignedUrlResponse = {
  presigned_url: string
  img_url: string
  key: string
}

// 메인(팔로잉) 피드 타입
export type MainFeedUser = {
  user_id: string
  nickname: string
  profile_img: string | null
}

export type MainFeedPost = {
  post_id: string
  thumbnail: string
  description: string
}

export type MainFeedSpotLocation = {
  place_name: string
  address_name: string
  road_address_name: string
  x: string
  y: string
}

export type MainFeedSpot = {
  spot_id: string
  location: MainFeedSpotLocation
  order: number
}

export type MainFeedItem = {
  user: MainFeedUser
  post: MainFeedPost
  spots: MainFeedSpot[]
  spot_count: number
  comment_count: number
  like_count: number
  is_liked: boolean
  is_bookmarked: boolean
}

export type MainFeedResponse = {
  next: string | null
  results: MainFeedItem[]
}

export type ExplorePost = {
  post_id: string
  thumbnail: string
  like_count: number
  comment_count: number
}

export type ExploreResponse = {
  next: string | null
  seed?: number
  results: ExplorePost[]
}

// 북마크 목록 — GET /posts/bookmarks
export type BookmarkListItem = {
  post_id: string
  thumbnail: string
  description: string
  comment_count: number
  is_liked: boolean
  like_count: number
}

export type BookmarkListResponse = {
  next: string | null
  results: BookmarkListItem[]
}
