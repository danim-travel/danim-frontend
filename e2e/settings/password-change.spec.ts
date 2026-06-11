/**
 * 내 정보 수정 > 비밀번호 변경 E2E 테스트
 *
 * - 모달 오픈 / 닫기
 * - 새 비밀번호 불일치 인라인 에러 및 제출 가드
 * - 현재 비밀번호 오류 인라인 에러 (서버 400 응답)
 * - 변경 성공 토스트 및 모달 닫힘
 * - 모달 재오픈 시 필드 초기화
 */

import { test, expect } from '@playwright/test'
import { setupAuthenticatedSettings } from './helpers'

// 모달 오픈까지 공통 셋업
async function openPasswordModal(page: Parameters<typeof setupAuthenticatedSettings>[0]) {
  await setupAuthenticatedSettings(page)
  await page.getByRole('button', { name: '비밀번호 변경' }).click()
  await expect(page.getByPlaceholder('현재 비밀번호를 입력해 주세요')).toBeVisible()
}

test.describe('비밀번호 변경 — 모달 오픈/닫기', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSettings(page)
  })

  test('"비밀번호 변경" 클릭 시 모달이 표시된다', async ({ page }) => {
    await page.getByRole('button', { name: '비밀번호 변경' }).click()

    await expect(page.getByPlaceholder('현재 비밀번호를 입력해 주세요')).toBeVisible()
    await expect(page.getByPlaceholder('새 비밀번호를 입력해 주세요')).toBeVisible()
    await expect(page.getByPlaceholder('새 비밀번호를 한 번 더 입력해 주세요')).toBeVisible()
  })

  test('Escape 키로 모달을 닫을 수 있다', async ({ page }) => {
    await page.getByRole('button', { name: '비밀번호 변경' }).click()
    await expect(page.getByPlaceholder('현재 비밀번호를 입력해 주세요')).toBeVisible()

    await page.keyboard.press('Escape')

    await expect(page.getByPlaceholder('현재 비밀번호를 입력해 주세요')).not.toBeVisible()
  })

  test('모달 닫기 후 재오픈 시 모든 필드가 초기화된다', async ({ page }) => {
    await page.getByRole('button', { name: '비밀번호 변경' }).click()
    await page.getByPlaceholder('현재 비밀번호를 입력해 주세요').fill('OldPass1!')
    await page.getByPlaceholder('새 비밀번호를 입력해 주세요').fill('NewPass1!')
    await page.keyboard.press('Escape')

    await page.getByRole('button', { name: '비밀번호 변경' }).click()

    await expect(page.getByPlaceholder('현재 비밀번호를 입력해 주세요')).toHaveValue('')
    await expect(page.getByPlaceholder('새 비밀번호를 입력해 주세요')).toHaveValue('')
    await expect(page.getByPlaceholder('새 비밀번호를 한 번 더 입력해 주세요')).toHaveValue('')
  })
})

test.describe('비밀번호 변경 — 유효성 검사', () => {
  test.beforeEach(async ({ page }) => {
    await openPasswordModal(page)
  })

  test('새 비밀번호와 확인이 불일치하면 인라인 에러가 표시된다', async ({ page }) => {
    await page.getByPlaceholder('새 비밀번호를 입력해 주세요').fill('NewPass1!')
    await page.getByPlaceholder('새 비밀번호를 한 번 더 입력해 주세요').fill('Different1!')

    await expect(page.getByText('비밀번호가 일치하지 않습니다.')).toBeVisible()
  })

  test('새 비밀번호 불일치 시 확인 버튼을 눌러도 모달이 유지된다 (제출 가드)', async ({
    page,
  }) => {
    await page.getByPlaceholder('현재 비밀번호를 입력해 주세요').fill('OldPass1!')
    await page.getByPlaceholder('새 비밀번호를 입력해 주세요').fill('NewPass1!')
    await page.getByPlaceholder('새 비밀번호를 한 번 더 입력해 주세요').fill('Different1!')

    await page.getByRole('button', { name: '확인' }).click()

    // API 미호출 → 모달 유지, 토스트 없음
    await expect(page.getByPlaceholder('현재 비밀번호를 입력해 주세요')).toBeVisible()
    await expect(page.getByRole('status')).not.toBeVisible()
  })

  test('현재 비밀번호 오류 시 인라인 에러가 표시된다 (서버 400)', async ({ page }) => {
    await page.evaluate(() => {
      const orig = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : String(input)
        if (url.includes('users/change-password')) {
          return new Response(
            JSON.stringify({ error_detail: '현재 비밀번호가 일치하지 않습니다.' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
          )
        }
        return orig(input, init)
      }
    })

    await page.getByPlaceholder('현재 비밀번호를 입력해 주세요').fill('WrongPass1!')
    await page.getByPlaceholder('새 비밀번호를 입력해 주세요').fill('NewPass1!')
    await page.getByPlaceholder('새 비밀번호를 한 번 더 입력해 주세요').fill('NewPass1!')
    await page.getByRole('button', { name: '확인' }).click()

    // 토스트가 아닌 인라인 에러 → 모달 유지 (서버 응답 메시지 그대로 표시)
    await expect(page.getByText('현재 비밀번호가 일치하지 않습니다.')).toBeVisible()
    await expect(page.getByPlaceholder('현재 비밀번호를 입력해 주세요')).toBeVisible()
  })
})

test.describe('비밀번호 변경 — 성공', () => {
  test.beforeEach(async ({ page }) => {
    await openPasswordModal(page)
  })

  test('변경 성공 시 성공 토스트가 표시된다', async ({ page }) => {
    await page.getByPlaceholder('현재 비밀번호를 입력해 주세요').fill('OldPass1!')
    await page.getByPlaceholder('새 비밀번호를 입력해 주세요').fill('NewPass1!')
    await page.getByPlaceholder('새 비밀번호를 한 번 더 입력해 주세요').fill('NewPass1!')
    await page.getByRole('button', { name: '확인' }).click()

    // 버튼 내부 로딩 스피너도 role="status" → 텍스트로 필터링
    await expect(page.getByRole('status').filter({ hasText: '비밀번호가 변경되었습니다.' })).toBeVisible()
  })

  test('변경 성공 시 모달이 닫힌다', async ({ page }) => {
    await page.getByPlaceholder('현재 비밀번호를 입력해 주세요').fill('OldPass1!')
    await page.getByPlaceholder('새 비밀번호를 입력해 주세요').fill('NewPass1!')
    await page.getByPlaceholder('새 비밀번호를 한 번 더 입력해 주세요').fill('NewPass1!')
    await page.getByRole('button', { name: '확인' }).click()

    await expect(page.getByRole('status').filter({ hasText: '비밀번호가 변경되었습니다.' })).toBeVisible()
    await expect(page.getByPlaceholder('현재 비밀번호를 입력해 주세요')).not.toBeVisible()
  })
})
