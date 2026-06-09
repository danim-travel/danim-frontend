/**
 * 유저 프로필 관련 타입.
 * GET /users/{user_id}/profile 응답 스펙을 따른다.
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
  email_token: string
  password: string
  password_confirm: string
  nickname: string
  name: string
  /** YYYY-MM-DD */
  birth_day: string
}

export interface ConfirmEmailResponse {
  detail: string
  email_token: string
}

export interface SignupResponse {
  detail: string
}

export interface TokenRefreshResponse {
  access_token: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
}

export interface CurrentUserResponse {
  user_id: string
  nickname: string
  profile_img: string | null
}

export interface MeDetailResponse {
  user_id: string
  name: string
  email: string
  birth_date: string
  nickname: string
  profile_img: string | null
  intro: string
}

export interface UpdateUserRequest {
  nickname?: string
  intro?: string
  profile_img?: string | null
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

export type FollowUser = {
  user_id: string
  nickname: string
  profile_img: string | null
  is_following: boolean
}

export type FollowListResponse = FollowUser[]
