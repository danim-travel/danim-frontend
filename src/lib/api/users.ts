import { apiClient } from '@/lib/apiClient'
import type { FollowListResponse, FollowResponse } from '@/types'

export async function getFollowers(userId: string): Promise<FollowListResponse> {
  return apiClient.get(`v1/users/${userId}/followers/`).json<FollowListResponse>()
}

export async function getFollowing(userId: string): Promise<FollowListResponse> {
  return apiClient.get(`v1/users/${userId}/following/`).json<FollowListResponse>()
}

export async function followUser(userId: string): Promise<FollowResponse> {
  return apiClient.post(`v1/users/${userId}/follow`).json<FollowResponse>()
}

export async function unfollowUser(userId: string): Promise<FollowResponse> {
  return apiClient.delete(`v1/users/${userId}/follow`).json<FollowResponse>()
}
