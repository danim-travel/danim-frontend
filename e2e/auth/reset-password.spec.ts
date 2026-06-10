/**
 * /reset-password 페이지 E2E 테스트
 *
 * API 의존 테스트는 MSW authHandlers가 활성화되어야 한다.
 * src/mocks/handlers/index.ts 에서 ...authHandlers 주석 해제 후 실행.
 *
 * Mock 인증 코드: 123456
 */

import { test, expect } from '@playwright/test'

test.describe('비밀번호 재설정 페이지 렌더링', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/reset-password')
  })

  test('비밀번호 재설정 페이지가 렌더링된다', async ({ page }) => {
    await expect(page).toHaveURL('/reset-password')
  })

  test('이메일 입력 필드가 표시된다', async ({ page }) => {
    await expect(page.getByPlaceholder('이메일 주소')).toBeVisible()
  })

  test('"인증 요청" 버튼이 표시된다', async ({ page }) => {
    await expect(page.getByRole('button', { name: '인증 요청' })).toBeVisible()
  })

  test('이메일 미입력 시 "인증 요청" 버튼이 비활성 상태이다', async ({ page }) => {
    await expect(page.getByRole('button', { name: '인증 요청' })).toBeDisabled()
  })

  test('"비밀번호 재설정" 버튼이 표시된다', async ({ page }) => {
    await expect(page.getByRole('button', { name: '비밀번호 재설정' })).toBeVisible()
  })

  test('인증 전 "비밀번호 재설정" 버튼이 비활성 상태이다', async ({ page }) => {
    await expect(page.getByRole('button', { name: '비밀번호 재설정' })).toBeDisabled()
  })

  test('인증 코드 필드는 인증 요청 전 표시되지 않는다', async ({ page }) => {
    await expect(page.getByPlaceholder('인증 코드 6자리 입력')).not.toBeVisible()
  })
})

// authHandlers 활성화 필요 (src/mocks/handlers/index.ts에서 ...authHandlers 주석 해제)
test.describe('이메일 인증 플로우', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/reset-password')
  })

  test('유효한 이메일 입력 후 인증 요청 시 인증 코드 필드가 표시된다', async ({ page }) => {
    await page.getByPlaceholder('이메일 주소').fill('user@test.com')
    await page.getByRole('button', { name: '인증 요청' }).click()
    await expect(page.getByPlaceholder('인증 코드 6자리 입력')).toBeVisible()
  })

  test('올바른 인증 코드(123456) 입력 시 인증 완료 메시지와 새 비밀번호 필드가 표시된다', async ({ page }) => {
    await page.getByPlaceholder('이메일 주소').fill('user@test.com')
    await page.getByRole('button', { name: '인증 요청' }).click()
    await page.getByPlaceholder('인증 코드 6자리 입력').fill('123456')
    await page.getByRole('button', { name: '확인' }).click()
    await expect(page.getByText('이메일 인증이 완료되었습니다.')).toBeVisible()
    await expect(page.getByPlaceholder('8자 이상, 영문+숫자+특수문자 조합')).toBeVisible()
  })

  test('잘못된 인증 코드 입력 시 에러 메시지가 표시된다', async ({ page }) => {
    await page.getByPlaceholder('이메일 주소').fill('user@test.com')
    await page.getByRole('button', { name: '인증 요청' }).click()
    await page.getByPlaceholder('인증 코드 6자리 입력').fill('000000')
    await page.getByRole('button', { name: '확인' }).click()
    await expect(page.getByText('인증 코드가 올바르지 않습니다.')).toBeVisible()
  })

  test('인증 요청 후 "재요청" 버튼이 표시되고 재요청 시 코드가 다시 발송된다', async ({ page }) => {
    await page.getByPlaceholder('이메일 주소').fill('user@test.com')
    await page.getByRole('button', { name: '인증 요청' }).click()
    await expect(page.getByRole('button', { name: '재요청' })).toBeVisible()

    await page.getByRole('button', { name: '재요청' }).click()
    await expect(page.getByPlaceholder('인증 코드 6자리 입력')).toBeVisible()
  })
})

// authHandlers 활성화 필요 (src/mocks/handlers/index.ts에서 ...authHandlers 주석 해제)
test.describe('비밀번호 재설정 폼 유효성 검사', () => {
  // 인증 완료 상태까지 셋업
  async function completeVerification(page: import('@playwright/test').Page) {
    await page.goto('/reset-password')
    await page.getByPlaceholder('이메일 주소').fill('user@test.com')
    await page.getByRole('button', { name: '인증 요청' }).click()
    await page.getByPlaceholder('인증 코드 6자리 입력').fill('123456')
    await page.getByRole('button', { name: '확인' }).click()
    await expect(page.getByText('이메일 인증이 완료되었습니다.')).toBeVisible()
  }

  test('새 비밀번호가 8자 미만이면 에러 메시지가 표시된다', async ({ page }) => {
    await completeVerification(page)
    await page.getByPlaceholder('8자 이상, 영문+숫자+특수문자 조합').fill('Ab1!')
    await page.getByRole('button', { name: '비밀번호 재설정' }).click()
    await expect(page.getByText('8자 이상이어야 합니다')).toBeVisible()
  })

  test('새 비밀번호 확인이 불일치하면 에러 메시지가 표시된다', async ({ page }) => {
    await completeVerification(page)
    await page.getByPlaceholder('8자 이상, 영문+숫자+특수문자 조합').fill('Test1234!')
    await page.getByPlaceholder('비밀번호를 다시 입력하세요').fill('Test9999!')
    await page.getByRole('button', { name: '비밀번호 재설정' }).click()
    await expect(page.getByText('비밀번호가 일치하지 않습니다')).toBeVisible()
  })

  test('올바른 비밀번호 입력 후 재설정 성공 시 /login으로 이동한다', async ({ page }) => {
    await completeVerification(page)
    await page.getByPlaceholder('8자 이상, 영문+숫자+특수문자 조합').fill('NewPass1!')
    await page.getByPlaceholder('비밀번호를 다시 입력하세요').fill('NewPass1!')
    await page.getByRole('button', { name: '비밀번호 재설정' }).click()
    await expect(page).toHaveURL('/login')
  })
})
