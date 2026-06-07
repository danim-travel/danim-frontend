/**
 * 유저 프로필 관련 타입.
 * GET /api/v1/users/{user_id}/profile 응답 스펙을 따른다.
 */

export type UserProfilePost = {
  post_id: number
  title: string
  thumbnail: string
}

export type UserProfileResponse = {
  name: string
  nickname: string
  profile_img: string
  intro: string
  follower: number
  following: number
  is_following: boolean
  posts_count: number
  posts: UserProfilePost[]
}
