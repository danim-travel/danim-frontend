/**
 * 내 정보 수정 > 닉네임 수정 E2E 테스트
 *
 * - 초기값 표시
 * - isDirty 에 따른 저장/취소 버튼 활성 상태
 * - 저장 성공 / 실패 토스트
 * - 저장 후 버튼 재비활성화
 * - 취소 시 원래 값 복원
 * - 저장 API 페이로드 검증
 */

import { test, expect } from '@playwright/test'
import { setupAuthenticatedSettings } from './helpers'

test.describe('닉네임 수정', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSettings(page)
  })

  test('닉네임 필드에 현재 닉네임이 초기값으로 채워진다', async ({ page }) => {
    // MSW mockMe.nickname = 'test_nickname'
    await expect(page.getByLabel('닉네임')).toHaveValue('test_nickname')
  })

  test('닉네임 변경 전에는 "변경사항 저장" 버튼이 비활성화된다', async ({ page }) => {
    await expect(page.getByRole('button', { name: '변경사항 저장' })).toBeDisabled()
  })

  test('닉네임 변경 시 "변경사항 저장" · "취소" 버튼이 활성화된다', async ({ page }) => {
    await page.getByLabel('닉네임').fill('new_nickname')

    await expect(page.getByRole('button', { name: '변경사항 저장' })).toBeEnabled()
    await expect(page.getByRole('button', { name: '취소' })).toBeEnabled()
  })

  test('"취소" 버튼 클릭 시 닉네임이 원래 값으로 복원된다', async ({ page }) => {
    await page.getByLabel('닉네임').fill('changed_name')

    await page.getByRole('button', { name: '취소' }).click()

    await expect(page.getByLabel('닉네임')).toHaveValue('test_nickname')
    await expect(page.getByRole('button', { name: '변경사항 저장' })).toBeDisabled()
  })

  test('닉네임 저장 성공 시 성공 토스트가 표시된다', async ({ page }) => {
    await page.getByLabel('닉네임').fill('saved_nickname')
    await page.getByRole('button', { name: '변경사항 저장' }).click()

    await expect(page.getByRole('status')).toContainText('변경사항이 저장되었습니다.')
  })

  test('닉네임 저장 성공 후 "변경사항 저장" 버튼이 다시 비활성화된다', async ({ page }) => {
    await page.getByLabel('닉네임').fill('saved_nickname')
    await page.getByRole('button', { name: '변경사항 저장' }).click()

    await expect(page.getByRole('status')).toBeVisible()
    await expect(page.getByRole('button', { name: '변경사항 저장' })).toBeDisabled()
  })

  test('닉네임 저장 실패 시 에러 토스트가 표시된다', async ({ page }) => {
    await page.evaluate(() => {
      const orig = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : String(input)
        const method = input instanceof Request ? input.method : (init?.method ?? 'GET')
        if (url.includes('users/me') && method === 'PATCH' && !url.includes('password')) {
          return new Response(
            JSON.stringify({ error_detail: '저장에 실패했습니다.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          )
        }
        return orig(input, init)
      }
    })

    await page.getByLabel('닉네임').fill('fail_nickname')
    await page.getByRole('button', { name: '변경사항 저장' }).click()

    await expect(page.getByRole('status')).toBeVisible()
  })

  test('저장 시 변경된 닉네임이 API 페이로드로 전송된다', async ({ page }) => {
    await page.evaluate(() => {
      const orig = window.fetch.bind(window)
      type WithCaptures = Window & { __patchBody: string | null }
      ;(window as unknown as WithCaptures).__patchBody = null
      window.fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : String(input)
        const method = input instanceof Request ? input.method : (init?.method ?? 'GET')
        if (url.includes('users/me') && method === 'PATCH' && !url.includes('password')) {
          try {
            const body =
              input instanceof Request ? await input.clone().text() : (init?.body as string ?? null)
            ;(window as unknown as WithCaptures).__patchBody = body
          } catch { /* ignore */ }
        }
        return orig(input, init)
      }
    })

    await page.getByLabel('닉네임').fill('captured_nick')
    await page.getByRole('button', { name: '변경사항 저장' }).click()
    await expect(page.getByRole('status')).toBeVisible()

    const body: string | null = await page.evaluate(
      () => (window as Window & { __patchBody?: string | null }).__patchBody ?? null,
    )
    expect(body).not.toBeNull()
    expect(JSON.parse(body!).nickname).toBe('captured_nick')
  })
})
