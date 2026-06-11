import { expect, type Page } from '@playwright/test'

/**
 * token/refresh 스텁으로 로그인 상태를 복원한 뒤 /settings로 이동한다.
 * authHandlers가 주석 처리된 환경에서도 동작한다.
 */
export async function setupAuthenticatedSettings(page: Page) {
  await page.addInitScript(() => {
    const orig = window.fetch.bind(window)
    window.fetch = async (input, init) => {
      const url = input instanceof Request ? input.url : String(input)
      const method = input instanceof Request ? input.method : (init?.method ?? 'GET')
      if (url.includes('/users/token/refresh') && method === 'POST') {
        return new Response(
          JSON.stringify({ access_token: 'mock_access_token' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return orig(input, init)
    }
  })
  await page.goto('/settings')
  await expect(page.getByRole('button', { name: '변경사항 저장' })).toBeVisible()
}
