import { publicClient, apiClient } from '@/lib/apiClient'
import type { SignupRequest, SignupResponse, TokenRefreshResponse, LoginRequest, LoginResponse, CurrentUserResponse, ConfirmEmailResponse, DetailResponse } from '@/types'

// --- 공개 엔드포인트 (access_token 불필요) ---

// 회원가입 — email_token(이메일 인증 완료 후 발급)과 함께 사용자 정보를 전송
export async function signup(data: SignupRequest): Promise<SignupResponse> {
  return publicClient.post('users/signup', { json: data }).json<SignupResponse>()
}

// 이메일로 인증 코드 발송 — purpose에 따라 회원가입/비밀번호 재설정 코드 구분
export async function requestEmailVerify(email: string, purpose: 'signup' | 'find_password'): Promise<DetailResponse> {
  return publicClient
    .post('users/verification/send-email', { json: { email, purpose } })
    .json<DetailResponse>()
}

// 인증 코드 검증 — 성공 시 백엔드가 email_token 발급 (회원가입 payload에 포함시킬 토큰)
export async function confirmEmailCode(email: string, code: string, purpose: 'signup' | 'find_password'): Promise<ConfirmEmailResponse> {
  return publicClient
    .post('users/verification/verify-email', { json: { email, code, purpose } })
    .json<ConfirmEmailResponse>()
}

/** 앱 마운트 시 silent refresh 및 소셜 로그인 콜백에서 사용. */
export async function refreshToken(): Promise<TokenRefreshResponse> {
  return publicClient.post('users/token/refresh').json<TokenRefreshResponse>()
}

// 이메일/비밀번호 로그인 — 성공 시 access_token 반환 (refresh_token은 HttpOnly 쿠키로 자동 저장)
export async function login(data: LoginRequest): Promise<LoginResponse> {
  return publicClient.post('users/login', { json: data }).json<LoginResponse>()
}

// 닉네임 중복 확인 — 409면 중복, 200이면 사용 가능
export async function checkNickname(nickname: string): Promise<DetailResponse> {
  return publicClient.post('users/check-nickname', { json: { nickname } }).json<DetailResponse>()
}

// 비밀번호 재설정 — 이메일 인증 후 발급된 email_token과 새 비밀번호 전송
export async function resetPassword(data: { email_token: string; new_password: string }): Promise<DetailResponse> {
  return publicClient.post('users/reset-password', { json: data }).json<DetailResponse>()
}

// --- 인증 필요 엔드포인트 (Authorization 헤더 자동 첨부) ---

// 내 정보 조회 — Authorization 헤더 필요, 로그인 직후 유저 정보 세팅에 사용
export async function getCurrentUser(): Promise<CurrentUserResponse> {
  return apiClient.get('users/me').json<CurrentUserResponse>()
}
