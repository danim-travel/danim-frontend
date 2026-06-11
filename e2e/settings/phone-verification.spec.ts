/**
 * 내 정보 수정 > 휴대폰 인증 E2E 테스트
 *
 * 휴대폰 인증은 준비 중 상태로 필드와 버튼이 비활성화되어 있다.
 * 렌더링 및 비활성화 여부만 검증한다.
 */

import { test, expect } from '@playwright/test'
import { setupAuthenticatedSettings } from './helpers'

test.describe('휴대폰 인증', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSettings(page)
  })

  test('전화번호 입력 필드가 표시된다', async ({ page }) => {
    await expect(page.getByPlaceholder('010-0000-0000')).toBeVisible()
  })

  test('"인증 요청" 버튼이 표시된다', async ({ page }) => {
    await expect(page.getByRole('button', { name: '인증 요청' })).toBeVisible()
  })

  test('전화번호 입력 필드가 비활성화되어 있다', async ({ page }) => {
    await expect(page.getByPlaceholder('010-0000-0000')).toBeDisabled()
  })

  test('"인증 요청" 버튼이 비활성화되어 있다', async ({ page }) => {
    await expect(page.getByRole('button', { name: '인증 요청' })).toBeDisabled()
  })

  test('"준비 중" 배지가 표시된다', async ({ page }) => {
    await expect(page.getByText('준비 중')).toBeVisible()
  })
})
