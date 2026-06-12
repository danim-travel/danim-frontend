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
  birth_day: string
  nickname: string
  profile_img: string | null
  intro: string | null
  phone_number: string | null
}

export interface UpdateUserRequest {
  nickname?: string
  intro?: string
  key?: string | null
}

export interface ChangePasswordRequest {
  password: string
  new_password: string
}

export interface ProfileImagePresignedResponse {
  presigned_url: string
  img_url: string
  key: string
}

export type FollowUser = {
  user_id: string
  nickname: string
  profile_img: string | null
  is_following: boolean
}

export type FollowListResponse = FollowUser[]

export type UserSearchResult = {
  user_id: string
  nickname: string
  profile_img: string | null
}

export type UserSearchResponse = UserSearchResult[]

export type SmsVerificationPurpose = 'signup' | 'find_email' | 'phone_change'

export interface SendSmsRequest {
  phone_number: string
  purpose: SmsVerificationPurpose
}

export interface VerifySmsRequest {
  phone_number: string
  code: string
  purpose: SmsVerificationPurpose
}

export interface VerifySmsResponse {
  detail: string
  sms_token: string
}
