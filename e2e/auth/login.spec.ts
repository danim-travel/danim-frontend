/**
 * /login 페이지 E2E 테스트
 *
 * API 의존 테스트는 MSW authHandlers가 활성화되어야 한다.
 * src/mocks/handlers/index.ts 에서 ...authHandlers 주석 해제 후 실행.
 *
 * Mock 계정: test@test.com / Test1234!
 */

import { test, expect } from '@playwright/test'

test.describe('로그인 페이지 렌더링', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('로그인 페이지가 렌더링된다', async ({ page }) => {
    await expect(page).toHaveURL('/login')
  })

  test('카카오 로그인 버튼이 표시된다', async ({ page }) => {
    await expect(page.getByRole('button', { name: '카카오톡으로 계속하기' })).toBeVisible()
  })

  test('Google 로그인 버튼이 표시된다', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Google로 계속하기' })).toBeVisible()
  })

  test('이메일 입력 필드가 표시된다', async ({ page }) => {
    await expect(page.getByPlaceholder('이메일 주소를 입력하세요')).toBeVisible()
  })

  test('비밀번호 입력 필드가 표시된다', async ({ page }) => {
    await expect(page.getByPlaceholder('비밀번호를 입력하세요')).toBeVisible()
  })

  test('"비밀번호를 잊으셨나요?" 링크가 표시된다', async ({ page }) => {
    await expect(page.getByRole('link', { name: '비밀번호를 잊으셨나요?' })).toBeVisible()
  })

  test('"비밀번호를 잊으셨나요?" 클릭 시 /reset-password로 이동한다', async ({ page }) => {
    await page.getByRole('link', { name: '비밀번호를 잊으셨나요?' }).click()
    await expect(page).toHaveURL('/reset-password')
  })

  test('로그인 버튼이 표시된다', async ({ page }) => {
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible()
  })
})

test.describe('로그인 폼 유효성 검사', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('이메일 없이 제출하면 에러 메시지가 표시된다', async ({ page }) => {
    await page.getByRole('button', { name: '로그인' }).click()
    await expect(page.getByText('이메일을 입력해주세요')).toBeVisible()
  })

  test('잘못된 이메일 형식이면 에러 메시지가 표시된다', async ({ page }) => {
    await page.getByPlaceholder('이메일 주소를 입력하세요').fill('notanemail')
    await page.getByRole('button', { name: '로그인' }).click()
    await expect(page.getByText('올바른 이메일 형식이 아닙니다')).toBeVisible()
  })

  test('비밀번호 없이 제출하면 에러 메시지가 표시된다', async ({ page }) => {
    await page.getByPlaceholder('이메일 주소를 입력하세요').fill('test@test.com')
    await page.getByRole('button', { name: '로그인' }).click()
    await expect(page.getByText('비밀번호를 입력해주세요')).toBeVisible()
  })
})

// authHandlers 활성화 필요 (src/mocks/handlers/index.ts에서 ...authHandlers 주석 해제)
test.describe('이메일 로그인', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('올바른 계정으로 로그인 시 홈(/)으로 이동한다', async ({ page }) => {
    await page.getByPlaceholder('이메일 주소를 입력하세요').fill('test@test.com')
    await page.getByPlaceholder('비밀번호를 입력하세요').fill('Test1234!')
    await page.getByRole('button', { name: '로그인' }).click()
    await expect(page).toHaveURL('/')
  })

  test('틀린 비밀번호로 로그인 시 토스트 에러가 표시된다', async ({ page }) => {
    await page.getByPlaceholder('이메일 주소를 입력하세요').fill('test@test.com')
    await page.getByPlaceholder('비밀번호를 입력하세요').fill('WrongPass1!')
    await page.getByRole('button', { name: '로그인' }).click()
    await expect(page.getByText('이메일 또는 비밀번호가 올바르지 않습니다')).toBeVisible()
  })
})
