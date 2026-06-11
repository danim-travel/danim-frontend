import { apiClient } from '@/lib/apiClient'
import type { MeDetailResponse, UpdateUserRequest, ChangePasswordRequest, DetailResponse, ProfileImagePresignedResponse, FollowListResponse, FollowResponse } from '@/types'

export async function getMe(): Promise<MeDetailResponse> {
  return apiClient.get('users/me/detail').json<MeDetailResponse>()
}

export async function updateUser(data: UpdateUserRequest): Promise<MeDetailResponse> {
  return apiClient.patch('users/me', { json: data }).json<MeDetailResponse>()
}

export async function deleteUser(): Promise<DetailResponse> {
  return apiClient.delete('users/me').json<DetailResponse>()
}

export async function changePassword(data: ChangePasswordRequest): Promise<DetailResponse> {
  return apiClient.post('users/change-password', { json: data }).json<DetailResponse>()
}

export async function getProfileImagePresignedUrl(fileName: string): Promise<ProfileImagePresignedResponse> {
  return apiClient.post('users/me/profile-image/presigned-url', { json: { original_img: fileName } }).json<ProfileImagePresignedResponse>()
}

export async function getFollowers(userId: string): Promise<FollowListResponse> {
  return apiClient.get(`users/${userId}/followers`).json<FollowListResponse>()
}

export async function getFollowing(userId: string): Promise<FollowListResponse> {
  return apiClient.get(`users/${userId}/following`).json<FollowListResponse>()
}

export async function followUser(userId: string): Promise<FollowResponse> {
  return apiClient.post(`follow/${userId}`).json<FollowResponse>()
}

export async function unfollowUser(userId: string): Promise<FollowResponse> {
  return apiClient.delete(`follow/${userId}`).json<FollowResponse>()
}
