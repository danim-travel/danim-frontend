export type PostImage = {
  img_url: string
  original_image_url: string
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
  }
  user: {
    user_id: number
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
