/**
 * 인증 관련 Mock 핸들러.
 * 로그인 / refresh 등 access_token 발급 엔드포인트를 처리한다.
 */
import { http, HttpResponse } from 'msw'

export const authHandlers = [
  http.post('*/v1/users/me/refresh', () => {
    return HttpResponse.json({ access_token: 'mock-access-token' })
  }),
]
