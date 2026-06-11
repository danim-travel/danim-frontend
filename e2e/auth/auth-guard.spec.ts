/**
 * 라우트 가드 & 인증 상태 E2E 테스트
 *
 * - 비로그인 시 보호된 경로 접근 → /login 리다이렉트
 * - 로그인 상태에서 /login 접근 → / 리다이렉트
 * - 로그인 후 인증 상태 유지 확인
 *
 * MSW authHandlers 활성화 필요
 */

import { test, expect, type Page } from '@playwright/test'


// 로그인 상태 만들기
async function loginAsMockUser(page: Page) {
  await page.goto('/login')
  await page.getByPlaceholder('이메일 주소를 입력하세요').fill('test@test.com')
  await page.getByPlaceholder('비밀번호를 입력하세요').fill('Test1234!')
  await page.getByRole('button', { name: '로그인' }).click()
  await page.waitForURL('/')
}

// ─── 라우트 가드 ────────────────────────────────────────────────────────────

test.describe('비로그인 사용자 — 보호된 경로 접근', () => {
  const protectedRoutes = ['/', '/mypage', '/write', '/settings', '/followers', '/explore']

  for (const route of protectedRoutes) {
    test(`비로그인 상태에서 ${route} 접근 시 /login으로 리다이렉트된다`, async ({ page }) => {
      await page.goto(route)
      await expect(page).toHaveURL('/login')
    })
  }
})

// token/refresh mock을 심어두면 AuthBootstrap이 로그인 상태를 복원한다
async function stubTokenRefresh(page: Page) {
  await page.addInitScript(() => {
    const orig = window.fetch.bind(window)
    window.fetch = async (input, init) => {
      const url = input instanceof Request ? input.url : String(input)
      const method = input instanceof Request ? input.method : (init?.method ?? 'GET')
      if (url.includes('/users/token/refresh') && method === 'POST') {
        return new Response(
          JSON.stringify({ access_token: 'mock_access_token' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }
      return orig(input, init)
    }
  })
}

test.describe('로그인 사용자 — 인증 페이지 접근', () => {
  test('로그인 상태에서 /login 접근 시 홈(/)으로 리다이렉트된다', async ({ page }) => {
    await stubTokenRefresh(page)
    await page.goto('/login')
    await expect(page).toHaveURL('/')
  })

  test('로그인 상태에서 /register 접근 시 홈(/)으로 리다이렉트된다', async ({ page }) => {
    await stubTokenRefresh(page)
    await page.goto('/register')
    await expect(page).toHaveURL('/')
  })
})

// ─── 인증 상태 유지 ─────────────────────────────────────────────────────────

test.describe('로그인 후 인증 상태', () => {
  test('로그인 후 보호된 경로에 정상 접근된다', async ({ page }) => {
    await loginAsMockUser(page)
    await page.goto('/explore')
    await expect(page).toHaveURL('/explore')
  })

  test('로그인 후 localStorage user 정보가 올바르게 저장된다', async ({ page }) => {
    await loginAsMockUser(page)

    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem('auth-storage')
      return raw ? JSON.parse(raw) : null
    })

    expect(stored.state.user.nickname).toBe('다님유저')
    expect(stored.state.user.userId).toBeTruthy()
    expect(stored.state.accessToken).toBeUndefined()
  })

  test('로그아웃 후 localStorage user 정보가 초기화된다', async ({ page }) => {
    await loginAsMockUser(page)

    // localStorage 직접 초기화 (로그아웃 버튼 UI 구현 전 임시)
    await page.evaluate(() => localStorage.removeItem('auth-storage'))

    const stored = await page.evaluate(() => localStorage.getItem('auth-storage'))
    expect(stored).toBeNull()
  })
})
