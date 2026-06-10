/**
 * 인증 플로우 고급 E2E 테스트
 *
 * - 완전한 멀티스텝 유저 플로우
 * - API 요청 페이로드 검증 (addInitScript로 window.fetch 래핑 — MSW보다 먼저 실행됨)
 * - 에러 → 복구 시나리오
 * - 로그인 후 인증 상태(localStorage) 검증
 *
 * MSW authHandlers 활성화 필요
 */

import { test, expect, type Page } from '@playwright/test'

// ─── 헬퍼 ──────────────────────────────────────────────────────────────────

async function completeEmailVerification(
  page: Page,
  email: string,
  purpose: 'signup' | 'reset'
) {
  const emailPlaceholder = purpose === 'signup' ? '이메일 주소를 입력해주세요' : '이메일 주소'
  await page.getByPlaceholder(emailPlaceholder).fill(email)
  await page.getByRole('button', { name: '인증 요청' }).click()
  await page.getByPlaceholder('인증 코드 6자리 입력').fill('123456')

  if (purpose === 'signup') {
    await page.getByRole('button', { name: '확인', exact: true }).click()
  } else {
    await page.getByRole('button', { name: '확인' }).click()
  }
  await expect(page.getByText('이메일 인증이 완료되었습니다.')).toBeVisible()
}

type CapturedRequest = { url: string; method: string; body: string | null }

/**
 * page.goto 전에 호출해야 한다.
 * window.fetch를 래핑해 MSW보다 먼저 요청 body를 캡처한다.
 * MSW는 service worker 레벨에서 인터셉트하므로 네트워크 레이어(CDP)에서는 body를 읽을 수 없음.
 */
async function installFetchSpy(page: Page) {
  await page.addInitScript(() => {
    const orig = window.fetch.bind(window)
    ;(window as Window & { __fetchCaptures: CapturedRequest[] }).__fetchCaptures = [] as CapturedRequest[]
    window.fetch = async (input, init) => {
      const url = input instanceof Request ? input.url : String(input)
      const method = input instanceof Request ? input.method : (init?.method ?? 'GET')

      // ky는 Request 객체에 body를 담아 전달 → clone().text()로 읽어야 함
      let body: string | null = null
      try {
        if (input instanceof Request && input.body !== null) {
          body = await input.clone().text()
        } else if (typeof init?.body === 'string') {
          body = init.body
        }
      } catch { /* ignore */ }

      ;(window as Window & { __fetchCaptures: CapturedRequest[] }).__fetchCaptures.push({ url, method, body })
      return orig(input, init)
    }
  })
}

async function getCapturedBody(
  page: Page,
  urlKeyword: string
): Promise<Record<string, unknown> | null> {
  const captures: CapturedRequest[] = await page.evaluate(
    () => (window as Window & { __fetchCaptures?: CapturedRequest[] }).__fetchCaptures ?? []
  )
  const match = captures.find(c => c.url.includes(urlKeyword) && c.method === 'POST')
  return match?.body ? JSON.parse(match.body) : null
}

// ─── 로그인 플로우 ──────────────────────────────────────────────────────────

test.describe('로그인 플로우 — API 페이로드 검증', () => {
  test('로그인 시 올바른 email/password가 전송된다', async ({ page }) => {
    await installFetchSpy(page)
    await page.goto('/login')

    await page.getByPlaceholder('이메일 주소를 입력하세요').fill('test@test.com')
    await page.getByPlaceholder('비밀번호를 입력하세요').fill('Test1234!')
    await page.getByRole('button', { name: '로그인' }).click()
    await page.waitForURL('/')

    const body = await getCapturedBody(page, '/users/login')
    expect(body).not.toBeNull()
    expect(body!.email).toBe('test@test.com')
    expect(body!.password).toBe('Test1234!')
  })

  test('로그인 성공 후 localStorage에 user 정보가 저장된다', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('이메일 주소를 입력하세요').fill('test@test.com')
    await page.getByPlaceholder('비밀번호를 입력하세요').fill('Test1234!')
    await page.getByRole('button', { name: '로그인' }).click()
    await page.waitForURL('/')

    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem('auth-storage')
      return raw ? JSON.parse(raw) : null
    })

    expect(stored).not.toBeNull()
    expect(stored.state.user.nickname).toBe('다님유저')
    expect(stored.state.user.userId).toBeTruthy()
    // accessToken은 인메모리 전용 — localStorage에 없어야 함
    expect(stored.state.accessToken).toBeUndefined()
  })

  test('서버 500 에러 발생 시 서버 오류 토스트가 표시된다', async ({ page }) => {
    // addInitScript: MSW보다 먼저 실행 — login 요청을 500으로 가로챔
    await page.addInitScript(() => {
      const orig = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : String(input)
        const method = input instanceof Request ? input.method : (init?.method ?? 'GET')
        if (url.includes('/users/login') && method === 'POST') {
          return new Response(JSON.stringify({ error_detail: '서버 오류' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        return orig(input, init)
      }
    })

    await page.goto('/login')
    await page.getByPlaceholder('이메일 주소를 입력하세요').fill('test@test.com')
    await page.getByPlaceholder('비밀번호를 입력하세요').fill('Test1234!')
    await page.getByRole('button', { name: '로그인' }).click()

    // Toast 컴포넌트는 role="status"로 렌더링됨
    await expect(page.getByRole('status')).toBeVisible()
    await expect(page.getByRole('status')).toContainText('서버 오류가 발생했습니다')
  })
})

// ─── 비밀번호 재설정 플로우 ─────────────────────────────────────────────────

test.describe('비밀번호 재설정 — 완전한 플로우', () => {
  test('이메일 인증 요청 시 purpose=find_password와 email이 전송된다', async ({ page }) => {
    await installFetchSpy(page)
    await page.goto('/reset-password')

    await page.getByPlaceholder('이메일 주소').fill('user@test.com')
    await page.getByRole('button', { name: '인증 요청' }).click()
    await expect(page.getByPlaceholder('인증 코드 6자리 입력')).toBeVisible()

    const body = await getCapturedBody(page, '/users/verification/send-email')
    expect(body).not.toBeNull()
    expect(body!.purpose).toBe('find_password')
    expect(body!.email).toBe('user@test.com')
  })

  test('비밀번호 재설정 요청 시 email_token + new_password가 전송된다', async ({ page }) => {
    await installFetchSpy(page)
    await page.goto('/reset-password')
    await completeEmailVerification(page, 'user@test.com', 'reset')

    await page.getByPlaceholder('8자 이상, 영문+숫자+특수문자 조합').fill('NewPass1!')
    await page.getByPlaceholder('비밀번호를 다시 입력하세요').fill('NewPass1!')
    await page.getByRole('button', { name: '비밀번호 재설정' }).click()
    await page.waitForURL('/login')

    const body = await getCapturedBody(page, '/users/reset-password')
    expect(body).not.toBeNull()
    expect(body!.email_token).toBe('mock_email_token_verified')
    expect(body!.new_password).toBe('NewPass1!')
  })

  test('틀린 인증 코드 → 올바른 코드로 재시도 시 인증이 완료된다', async ({ page }) => {
    await page.goto('/reset-password')
    await page.getByPlaceholder('이메일 주소').fill('user@test.com')
    await page.getByRole('button', { name: '인증 요청' }).click()

    // 틀린 코드
    await page.getByPlaceholder('인증 코드 6자리 입력').fill('000000')
    await page.getByRole('button', { name: '확인' }).click()
    await expect(page.getByText('인증 코드가 올바르지 않습니다.')).toBeVisible()

    // 올바른 코드로 재시도
    await page.getByPlaceholder('인증 코드 6자리 입력').fill('123456')
    await page.getByRole('button', { name: '확인' }).click()
    await expect(page.getByText('이메일 인증이 완료되었습니다.')).toBeVisible()
  })

  test('전체 플로우: 이메일 인증 → 코드 확인 → 비밀번호 변경 → 로그인 페이지 이동', async ({ page }) => {
    await page.goto('/reset-password')
    await completeEmailVerification(page, 'user@test.com', 'reset')

    await page.getByPlaceholder('8자 이상, 영문+숫자+특수문자 조합').fill('NewPass1!')
    await page.getByPlaceholder('비밀번호를 다시 입력하세요').fill('NewPass1!')
    await page.getByRole('button', { name: '비밀번호 재설정' }).click()

    await expect(page).toHaveURL('/login')
  })
})

// ─── 회원가입 플로우 ────────────────────────────────────────────────────────

test.describe('회원가입 — API 페이로드 검증', () => {
  test('이메일 인증 요청 시 purpose=signup과 email이 전송된다', async ({ page }) => {
    await installFetchSpy(page)
    await page.goto('/register')

    await page.getByPlaceholder('이메일 주소를 입력해주세요').fill('newuser@test.com')
    await page.getByRole('button', { name: '인증 요청' }).click()
    await expect(page.getByPlaceholder('인증 코드 6자리 입력')).toBeVisible()

    const body = await getCapturedBody(page, '/users/verification/send-email')
    expect(body).not.toBeNull()
    expect(body!.purpose).toBe('signup')
    expect(body!.email).toBe('newuser@test.com')
  })

  test('인증 완료 후 이메일 필드가 비활성화된다', async ({ page }) => {
    await page.goto('/register')
    await completeEmailVerification(page, 'newuser@test.com', 'signup')
    await expect(page.getByPlaceholder('이메일 주소를 입력해주세요')).toBeDisabled()
  })
})
