import { apiClient } from '@/lib/apiClient'
import type { MeDetailResponse, UpdateUserRequest, ChangePasswordRequest, DetailResponse, ProfileImagePresignedResponse, FollowListResponse, FollowUser, FollowResponse, UserSearchResponse } from '@/types'

/** 내 상세 정보(닉네임·이메일·소개 등)를 조회한다. */
export async function getMe(): Promise<MeDetailResponse> {
  return apiClient.get('users/me').json<MeDetailResponse>()
}

/** 내 프로필(닉네임·소개·프로필 이미지)을 수정한다. */
export async function updateUser(data: UpdateUserRequest): Promise<MeDetailResponse> {
  return apiClient.patch('users/me', { json: data }).json<MeDetailResponse>()
}

/** 회원 탈퇴 처리한다. 성공 시 204 No Content 반환.
 *  - 이메일 로그인: password 필수
 *  - 소셜 로그인: password 없이 body 없는 DELETE 요청
 */
export async function deleteUser(password?: string): Promise<void> {
  if (password) {
    await apiClient.delete('users/me', { json: { password } })
  } else {
    await apiClient.delete('users/me')
  }
}

/** 비밀번호를 변경한다. */
export async function changePassword(data: ChangePasswordRequest): Promise<DetailResponse> {
  return apiClient.post('users/change-password', { json: data }).json<DetailResponse>()
}

/** 프로필 이미지 업로드용 S3 presigned URL을 발급한다. */
export async function getProfileImagePresignedUrl(fileName: string): Promise<ProfileImagePresignedResponse> {
  return apiClient.post('users/me/profile-image/presigned-url', { json: { original_img: fileName } }).json<ProfileImagePresignedResponse>()
}

/** 특정 유저의 팔로워 목록을 조회한다. */
export async function getFollowers(userId: string): Promise<FollowUser[]> {
  const res = await apiClient.get(`users/${userId}/followers`).json<FollowListResponse>()
  return res.results
}

/** 특정 유저의 팔로잉 목록을 조회한다. */
export async function getFollowing(userId: string): Promise<FollowUser[]> {
  const res = await apiClient.get(`users/${userId}/following`).json<FollowListResponse>()
  return res.results
}

/** 특정 유저를 팔로우한다. */
export async function followUser(userId: string): Promise<FollowResponse> {
  return apiClient.post(`follow/${userId}`).json<FollowResponse>()
}

/** 특정 유저를 언팔로우한다. */
export async function unfollowUser(userId: string): Promise<FollowResponse> {
  return apiClient.delete(`follow/${userId}`).json<FollowResponse>()
}

/** 닉네임으로 유저를 검색한다. */
export async function searchUsers(nickname: string): Promise<UserSearchResponse> {
  const res = await apiClient.get('users', { searchParams: { search: nickname } }).json<{ results: UserSearchResponse }>()
  return res.results
}
