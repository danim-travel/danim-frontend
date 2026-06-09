/**
 * 인증 관련 Mock 핸들러.
 * signup / email-verify / login / me / token-refresh 엔드포인트를 처리한다.
 */
import { http, HttpResponse } from 'msw'
import { MOCK_USER, MOCK_ACCESS_TOKEN, MOCK_CREDENTIALS, MOCK_VERIFY_CODE } from '../constants'

// 로그인 성공 시 true로 설정 — token/refresh는 이 플래그가 true일 때만 성공 반환
// 실제 HttpOnly refresh_token 쿠키를 간소하게 흉내낸 것
let mockSessionActive = false

export const authHandlers = [
  // 회원가입
  http.post('*/users/signup', async () => {
    return HttpResponse.json(
      { detail: '회원가입이 완료되었습니다.' },
      { status: 201 }
    )
  }),

  // 통합 이메일 인증 발송
  http.post('*/users/verification/send-email', async ({ request }) => {
    const body = await request.json() as { purpose?: string }
    const detail = body.purpose === 'find_password'
      ? '비밀번호 재설정 코드가 전송되었습니다.'
      : '이메일 인증 코드가 전송되었습니다.'
    return HttpResponse.json({ detail })
  }),

  // 통합 이메일 인증 검증 — mock 코드: 123456
  http.post('*/users/verification/verify-email', async ({ request }) => {
    const body = await request.json() as { code?: string; purpose?: string }
    if (body.code !== MOCK_VERIFY_CODE) {
      return HttpResponse.json(
        { error_detail: '인증 코드가 올바르지 않습니다.' },
        { status: 400 }
      )
    }
    const detail = body.purpose === 'find_password'
      ? '비밀번호 재설정 인증에 성공하였습니다.'
      : '이메일 인증에 성공하였습니다.'
    return HttpResponse.json({
      detail,
      email_token: 'mock_email_token_verified',
    })
  }),

  // 이메일 로그인 — mock 계정: test@test.com / Test1234!
  http.post('*/users/login', async ({ request }) => {
    const body = await request.json() as { email?: string; password?: string }
    if (!body.email || !body.password) {
      return HttpResponse.json(
        { error_detail: '이메일 또는 비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }
    if (body.email !== MOCK_CREDENTIALS.email || body.password !== MOCK_CREDENTIALS.password) {
      return HttpResponse.json(
        { error_detail: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }
    mockSessionActive = true
    return HttpResponse.json({ access_token: MOCK_ACCESS_TOKEN })
  }),

  // 내 정보 조회
  http.get('*/users/me', () => {
    return HttpResponse.json({
      user_id: MOCK_USER.userId,
      nickname: MOCK_USER.nickname,
      profile_img: MOCK_USER.profileImg,
    })
  }),

  // JWT 토큰 재발급 — mockSessionActive(로그인 여부)가 true일 때만 성공
  http.post('*/users/token/refresh', () => {
    if (!mockSessionActive) {
      return HttpResponse.json({ error_detail: '인증이 필요합니다.' }, { status: 401 })
    }
    return HttpResponse.json({ access_token: MOCK_ACCESS_TOKEN })
  }),

  // 닉네임 중복 확인
  http.post('*/users/check-nickname', async ({ request }) => {
    const body = await request.json() as { nickname?: string }
    if (body.nickname === MOCK_USER.nickname) {
      return HttpResponse.json(
        { error_detail: '중복된 닉네임 입니다.' },
        { status: 409 }
      )
    }
    return HttpResponse.json({ detail: '사용가능한 닉네임 입니다.' })
  }),
]
