/**
 * 내 정보 수정 > 로그아웃 E2E 테스트
 *
 * - 로그아웃 성공 시 /login 이동
 * - logout API 실패해도 클라이언트 정리 후 /login 이동
 * - 로그아웃 후 /settings 재접근 시 /login 리다이렉트
 */

import { test, expect } from '@playwright/test'
import { setupAuthenticatedSettings } from './helpers'

test.describe('로그아웃', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSettings(page)
  })

  test('"로그아웃" 클릭 시 /login으로 이동한다', async ({ page }) => {
    await page.getByRole('button', { name: '로그아웃' }).click()

    await page.waitForURL('/login', { timeout: 8_000 })
    await expect(page).toHaveURL('/login')
  })

  test('logout API 실패해도 /login으로 이동한다 (클라이언트 정리 우선)', async ({ page }) => {
    // logout 엔드포인트를 500으로 강제 실패
    await page.evaluate(() => {
      const orig = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : String(input)
        if (url.includes('users/logout')) {
          return new Response(null, { status: 500 })
        }
        return orig(input, init)
      }
    })

    await page.getByRole('button', { name: '로그아웃' }).click()

    await page.waitForURL('/login', { timeout: 8_000 })
    await expect(page).toHaveURL('/login')
  })

  // NOTE: addInitScript 스텁은 페이지 전환 후에도 유지되므로
  //       /settings 재방문 시 token/refresh가 다시 성공 → 재인증됨.
  //       AuthGuard 리다이렉트는 auth-guard.spec.ts에서 별도 검증한다.
})
