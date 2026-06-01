import ky from 'ky'
import { config } from '@/lib/config'
import { useAuthStore } from '@/store/authStore'

type ApiErrorDetail = string | Record<string, string[]>

export type ApiError = Error & {
  readonly status: number
  readonly detail: ApiErrorDetail
}

export function createApiError(status: number, detail: ApiErrorDetail): ApiError {
  return Object.assign(
    new Error(typeof detail === 'string' ? detail : JSON.stringify(detail)),
    { name: 'ApiError', status, detail }
  ) as ApiError
}

export function isApiError(error: unknown): error is ApiError {
  return (
    error instanceof Error &&
    error.name === 'ApiError' &&
    'status' in error &&
    'detail' in error
  )
}

// 인증 헤더가 붙지 않는 클라이언트. 로그인·회원가입·refresh처럼 access_token이 없는 상태에서 호출하는 엔드포인트 전용.
export const publicClient = ky.create({
  prefixUrl: config.apiUrl,
  credentials: 'include',
})

// 동시에 여러 요청이 401을 받아도 refresh 호출은 한 번만 일어나도록 싱글턴으로 공유한다.
let refreshPromise: Promise<string> | null = null

function getRefreshPromise(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = publicClient
      .post('v1/users/me/refresh')
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

export const apiClient = ky.create({
  prefixUrl: config.apiUrl,
  credentials: 'include',
  hooks: {
    // 모든 요청에 현재 access_token을 Authorization 헤더로 자동 부착한다.
    beforeRequest: [
      (request) => {
        const token = useAuthStore.getState().accessToken
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`)
        }
      },
    ],
    // 401 응답을 받으면 refresh로 새 토큰을 받아 같은 요청을 한 번 재시도한다.
    afterResponse: [
      async (request, options, response) => {
        if (response.status !== 401) return
        const headers = new Headers(options.headers as HeadersInit)
        // 재시도 요청이 다시 401을 받는 경우 무한 루프를 막기 위한 플래그.
        if (headers.get('x-is-retry')) return
        try {
          const newToken = await getRefreshPromise()
          headers.set('Authorization', `Bearer ${newToken}`)
          // 재시도임을 표시 — 다음 401에서 또 refresh로 진입하지 않도록.
          headers.set('x-is-retry', '1')
          return await ky(request, { ...options, headers })
        } catch {
          return response
        }
      },
    ],
    // 에러 응답 body를 ApiError로 정규화 — 호출부에서 일관된 형태로 다루기 위함.
    beforeError: [
      async (error) => {
        try {
          const body = await error.response.clone().json() as { error_detail?: ApiErrorDetail }
          throw createApiError(error.response.status, body.error_detail ?? error.message)
        } catch (e) {
          if (isApiError(e)) throw e
          throw createApiError(error.response.status, error.message)
        }
      },
    ],
  },
})
