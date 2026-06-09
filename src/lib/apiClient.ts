import ky, { type HTTPError } from 'ky'
import { config } from '@/lib/config'
import { useAuthStore } from '@/store/authStore'
import { createApiError, isApiError, type ApiErrorDetail } from '@/lib/apiError'

const baseClient = ky.create({
  prefixUrl: config.apiUrl,
  credentials: 'include',
})

// 에러 응답 body를 ApiError로 정규화하는 훅. publicClient·apiClient 양쪽에 공유된다.
const normalizeErrorHook = [
  async (error: HTTPError) => {
    try {
      const body = await error.response.clone().json() as { error_detail?: ApiErrorDetail }
      // 없으면(??) ky 기본 에러 메시지(error.message) 사용
      throw createApiError(error.response.status, body.error_detail ?? error.message)
    } catch (e) {
      if (isApiError(e)) throw e
      // JSON 파싱이 실패한 경우(응답 body가 완전히 비어있을 때, 네트워크 오류로 body 자체를 못 읽었을 때 등등)
      throw createApiError(error.response.status, error.message)
    }
  },
]

// 인증 헤더가 붙지 않는 클라이언트. 로그인·회원가입·refresh처럼 access_token이 없는 상태에서 호출하는 엔드포인트 전용.
export const publicClient = baseClient.extend({
  hooks: { beforeError: normalizeErrorHook },
})

// 401 재시도 전용 클라이언트.
// baseClient 설정은 공유하되, beforeError만 추가해서 재시도 실패 시 에러 정규화를 유지한다.
const retryClient = baseClient.extend({
  hooks: { beforeError: normalizeErrorHook },
})

// 동시에 여러 요청이 401을 받아도 refresh 호출은 한 번만 일어나도록 싱글턴으로 공유한다.
let refreshPromise: Promise<string> | null = null

/**
 * 401 자동 재시도 전용 토큰 갱신.
 * - AuthBootstrap의 silent refresh와 달리, 인증된 요청 중 토큰 만료 시 자동으로 호출된다.
 * - 성공 시 authStore 토큰 갱신, 실패 시 authStore 초기화 + /login 리다이렉트 사이드이펙트 발생.
 * - 동시 401 응답이 와도 refresh 요청은 한 번만 발생한다(singleton promise).
 */
function acquireRefreshedToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = publicClient
      .post('v1/users/token/refresh')
      .json<{ access_token: string }>()
      .then(data => {
        useAuthStore.getState().setToken(data.access_token)
        return data.access_token
      })
      .catch(err => {
        useAuthStore.getState().clearAuth()
        if (typeof window !== 'undefined') window.location.href = '/login'
        throw err
      })
      .finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

// 인증이 필요한 모든 API 요청에 사용하는 클라이언트.
// Authorization 헤더 자동 첨부, 401 시 토큰 갱신 재시도, 에러 정규화를 훅으로 처리한다.
export const apiClient = baseClient.extend({
  hooks: {
    beforeRequest: [
      (request) => {
        const token = useAuthStore.getState().accessToken
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`)
        }
      },
    ],
    afterResponse: [
      async (request, options, response) => {
        if (response.status !== 401) return
        const headers = new Headers(options.headers as HeadersInit)
        if (headers.get('x-is-retry')) return
        try {
          const newToken = await acquireRefreshedToken()
          headers.set('Authorization', `Bearer ${newToken}`)
          headers.set('x-is-retry', '1')
          return await retryClient(request, { ...options, headers })
        } catch {
          return response
        }
      },
    ],
    beforeError: normalizeErrorHook,
  },
})
