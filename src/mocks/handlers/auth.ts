/**
 * 인증 관련 Mock 핸들러.
 * signup / email-verify / token-refresh / me-refresh 엔드포인트를 처리한다.
 */
import { http, HttpResponse } from 'msw'
import { MOCK_USER, MOCK_ACCESS_TOKEN } from '../constants'

/** mock 이메일 인증 코드. 개발 환경에서만 사용된다. */
const MOCK_VERIFY_CODE = '123456'

export const authHandlers = [
  // 회원가입
  http.post('*/v1/users/signup', async ({ request }) => {
    const body = await request.json() as { nickname?: string }
    return HttpResponse.json(
      {
        access_token: MOCK_ACCESS_TOKEN,
        user: {
          user_id: MOCK_USER.userId,
          nickname: body.nickname ?? MOCK_USER.nickname,
          profile_img: MOCK_USER.profileImg,
        },
      },
      { status: 201 }
    )
  }),

  // 이메일 인증 요청
  http.post('*/v1/users/email/verify-request', () => {
    return HttpResponse.json({ detail: '인증 코드를 발송했습니다.' })
  }),

  // 이메일 인증 코드 확인 — mock 코드: 123456
  http.post('*/v1/users/email/verify', async ({ request }) => {
    const body = await request.json() as { code?: string }
    if (body.code !== MOCK_VERIFY_CODE) {
      return HttpResponse.json(
        { error_detail: '인증 코드가 올바르지 않습니다.' },
        { status: 400 }
      )
    }
    return HttpResponse.json({ detail: '이메일 인증이 완료되었습니다.' })
  }),

  // accessToken 재발급 (refreshToken 쿠키 기반)
  http.post('*/v1/users/token/refresh', () => {
    return HttpResponse.json({ access_token: MOCK_ACCESS_TOKEN })
  }),

  // 내 정보 갱신 / silent refresh
  http.post('*/v1/users/me/refresh', () => {
    return HttpResponse.json({ access_token: MOCK_ACCESS_TOKEN })
  }),
]
