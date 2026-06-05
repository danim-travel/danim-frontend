/**
 * 유저 프로필 관련 타입.
 * GET /api/v1/users/{user_id}/profile 응답 스펙을 따른다.
 */

export type UserProfilePost = {
  post_id: string
  title: string
  thumbnail: string
}

export type UserProfileResponse = {
  name: string
  nickname: string
  profile_img: string | null
  intro: string
  follower: number
  following: number
  is_following: boolean
  posts_count: number
  posts: UserProfilePost[]
}

export interface SignupRequest {
  email: string
  password: string
  nickname: string
  name: string
  gender: 'male' | 'female'
  /** YYYY-MM-DD */
  birth_date: string
}

export interface AuthUserResponse {
  user_id: string
  nickname: string
  profile_img: string | null
}

export interface SignupResponse {
  access_token: string
  user: AuthUserResponse
}

export interface TokenRefreshResponse {
  access_token: string
}
