import { publicClient } from '@/lib/apiClient'
import type { SignupRequest, SignupResponse, TokenRefreshResponse } from '@/types'

export async function signup(data: SignupRequest): Promise<SignupResponse> {
  return publicClient.post('v1/users/signup', { json: data }).json<SignupResponse>()
}

export async function requestEmailVerify(email: string): Promise<{ detail: string }> {
  return publicClient
    .post('v1/users/email/verify-request', { json: { email } })
    .json<{ detail: string }>()
}

export async function confirmEmailCode(email: string, code: string): Promise<{ detail: string }> {
  return publicClient
    .post('v1/users/email/verify', { json: { email, code } })
    .json<{ detail: string }>()
}

export async function refreshToken(): Promise<TokenRefreshResponse> {
  return publicClient.post('v1/users/token/refresh').json<TokenRefreshResponse>()
}
