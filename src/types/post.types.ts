export type PostImage = {
  img_url: string
  original_img: string
  img_order: number
}

export type SpotLocation = {
  place_name: string
  address_name: string
  road_address_name: string
  x: number
  y: number
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
    content: string
    thumbnail: string
    created_at: string
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
}

export type CreatePostSpot = {
  order: number
  content: string
  location: CreatePostSpotLocation
  images: CreatePostSpotImage[]
}

export type CreatePostRequest = {
  title: string
  thumbnail: string
  spots: CreatePostSpot[]
  // content 필드 없음 (의도적으로 제거됨)
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
