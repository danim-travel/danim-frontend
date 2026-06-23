/**
 * 인증 관련 Mock 핸들러.
 * signup / email-verify / login / me / token-refresh 엔드포인트를 처리한다.
 */
import { http, HttpResponse } from 'msw'
import type { MeDetailResponse, UpdateUserRequest } from '@/types'
import { MOCK_USER, MOCK_ACCESS_TOKEN, MOCK_CREDENTIALS, MOCK_VERIFY_CODE, MOCK_EMAIL_TOKEN } from '../constants'

// 로그인 성공 시 true로 설정 — token/refresh는 이 플래그가 true일 때만 성공 반환
// sessionStorage로 유지해 페이지 새로고침 후에도 로그인 상태가 복원되도록 한다.
let mockSessionActive = sessionStorage.getItem('mockSession') === 'true'

export const mockAuthUser = {
  user_id: MOCK_USER.userId,
  nickname: MOCK_USER.nickname,
  profile_img: MOCK_USER.profileImg,
}

/**
 * GET/PATCH /users/me 사이에 공유되는 내 상세 정보 mock 상태.
 * 실제 서버처럼 PATCH로 수정한 값이 이후 GET 응답에 반영되도록 모듈 변수로 유지한다.
 * (이 상태가 없으면 GET이 항상 초기값을 반환해 설정 저장값이 재진입 시 사라진다.)
 */
let mockMe: MeDetailResponse = {
  user_id: MOCK_USER.userId,
  name: '카카오',
  email: 'test@test.com',
  birth_day: '2001-01-01',
  nickname: MOCK_USER.nickname,
  profile_img: MOCK_USER.profileImg,
  intro: null,
  phone_number: null,
}

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
      email_token: MOCK_EMAIL_TOKEN,
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
    sessionStorage.setItem('mockSession', 'true')
    return HttpResponse.json({ access_token: MOCK_ACCESS_TOKEN })
  }),

  // JWT 토큰 재발급 — mockSessionActive(로그인 여부)가 true일 때만 성공
  http.post('*/users/token/refresh', () => {
    if (!mockSessionActive) {
      return HttpResponse.json({ error_detail: '인증이 필요합니다.' }, { status: 401 })
    }
    return HttpResponse.json({ access_token: MOCK_ACCESS_TOKEN })
  }),

  // 비밀번호 재설정 — email_token + new_password
  http.post('*/users/reset-password', async ({ request }) => {
    const body = await request.json() as { email_token?: string; new_password?: string }
    if (body.email_token !== MOCK_EMAIL_TOKEN) {
      return HttpResponse.json(
        { error_detail: '유효하지 않은 인증 토큰입니다.' },
        { status: 400 }
      )
    }
    return HttpResponse.json({ detail: '비밀번호가 재설정되었습니다.' })
  }),

  // 로그아웃 — mockSession 초기화
  http.post('*/users/logout', ({ request }) => {
    if (!request.headers.get('Authorization')) {
      return HttpResponse.json({ error_detail: '자격 인증 데이터가 제공되지 않습니다.' }, { status: 401 })
    }
    mockSessionActive = false
    sessionStorage.removeItem('mockSession')
    return HttpResponse.json({ detail: '로그아웃되었습니다.' })
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
  // 내 상세 정보 조회 — PATCH로 갱신된 mockMe 상태를 반환해 저장값이 유지되도록 한다
  http.get('*/users/me', () => {
    return HttpResponse.json(mockMe)
  }),

  // 내 정보 수정 — 전달된 필드만 mockMe에 반영하고, 갱신된 전체 상세를 반환한다
  http.patch('*/users/me', async ({ request }) => {
    if (!request.headers.get('Authorization')) {
      return HttpResponse.json({ error_detail: '자격 인증 데이터가 제공되지 않습니다.' }, { status: 401 })
    }
    const body = await request.json() as UpdateUserRequest
    mockMe = {
      ...mockMe,
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.birth_day !== undefined ? { birth_day: body.birth_day } : {}),
      ...(body.nickname !== undefined ? { nickname: body.nickname } : {}),
      ...(body.intro !== undefined ? { intro: body.intro } : {}),
      // key: 프로필 이미지 S3 key — 빈 문자열은 삭제(null)로, 그 외에는 미리보기 URL로 반영
      ...(body.key !== undefined ? { profile_img: body.key === '' ? null : `https://picsum.photos/seed/${body.key}/200/200` } : {}),
    }
    return HttpResponse.json(mockMe)
  }),
]
