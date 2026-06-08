import { publicClient, apiClient } from '@/lib/apiClient'
import type { SignupRequest, SignupResponse, TokenRefreshResponse, LoginRequest, LoginResponse, CurrentUserResponse, ConfirmEmailResponse } from '@/types'

export async function signup(data: SignupRequest): Promise<SignupResponse> {
  return publicClient.post('v1/users/signup', { json: data }).json<SignupResponse>()
}

export async function requestEmailVerify(email: string): Promise<{ detail: string }> {
  return publicClient
    .post('v1/users/email/verify-request', { json: { email } })
    .json<{ detail: string }>()
}

export async function confirmEmailCode(email: string, code: string): Promise<ConfirmEmailResponse> {
  return publicClient
    .post('v1/users/email/verify', { json: { email, code } })
    .json<ConfirmEmailResponse>()
}

export async function refreshToken(): Promise<TokenRefreshResponse> {
  return publicClient.post('v1/users/token/refresh').json<TokenRefreshResponse>()
}

export async function refreshMeToken(): Promise<TokenRefreshResponse> {
  return publicClient.post('v1/users/me/refresh').json<TokenRefreshResponse>()
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  return publicClient.post('v1/users/login', { json: data }).json<LoginResponse>()
}

export async function getCurrentUser(): Promise<CurrentUserResponse> {
  return apiClient.get('v1/users/me').json<CurrentUserResponse>()
}
