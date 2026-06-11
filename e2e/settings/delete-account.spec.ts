/**
 * 내 정보 수정 > 계정 삭제 E2E 테스트
 *
 * - 모달 오픈 / 닫기
 * - 확인 버튼 활성화 조건 (체크박스 + 정확한 문구)
 * - 삭제 성공 시 /login 이동
 * - 삭제 실패 시 에러 토스트 + 모달 유지
 * - 삭제 실패 후 확인 버튼 재활성화
 * - 모달 재오픈 시 상태 초기화
 *
 * [NOTE] Checkbox 컴포넌트의 <input>은 sr-only(1×1px clip)이므로
 *        click({ force: true })로 actionability 검사를 우회한다.
 *        토스트 선택 시 [role="status"][data-variant]로 버튼 내부
 *        로딩 스피너(role="status", 데이터 속성 없음)와 구분한다.
 */

import { test, expect, type Page } from '@playwright/test'
import { setupAuthenticatedSettings } from './helpers'

// 체크박스 클릭 헬퍼
// Checkbox 컴포넌트의 <input>은 sr-only(1×1px, viewport 밖)이므로
// input 대신 이를 감싸는 <label> 요소를 클릭한다.
function clickCheckbox(page: Page) {
  return page
    .getByRole('dialog')
    .locator('label')
    .filter({ hasText: '위 주의사항을' })
    .click()
}

// 토스트 로케이터 — 버튼 내부 로딩 스피너(role="status", data-variant 없음)와 구분
function toastLocator(page: Page) {
  return page.locator('[role="status"][data-variant]')
}

// 삭제 확인 모달 오픈까지 공통 셋업
async function openDeleteModal(page: Page) {
  await setupAuthenticatedSettings(page)
  await page.getByRole('button', { name: '계정 삭제' }).click()
  await expect(page.getByPlaceholder('삭제하겠습니다')).toBeVisible()
}

test.describe('계정 삭제 — 모달 오픈/닫기', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSettings(page)
  })

  test('"계정 삭제" 클릭 시 확인 모달이 표시된다', async ({ page }) => {
    await page.getByRole('button', { name: '계정 삭제' }).click()

    await expect(page.getByPlaceholder('삭제하겠습니다')).toBeVisible()
    await expect(page.getByText('위 주의사항을 모두 확인했으며')).toBeVisible()
  })

  test('"취소" 버튼 클릭 시 모달이 닫힌다', async ({ page }) => {
    await page.getByRole('button', { name: '계정 삭제' }).click()
    await expect(page.getByPlaceholder('삭제하겠습니다')).toBeVisible()

    await page.getByRole('dialog').getByRole('button', { name: '취소' }).click()

    await expect(page.getByPlaceholder('삭제하겠습니다')).not.toBeVisible()
  })

  test('모달 닫기 후 재오픈 시 체크박스와 입력 필드가 초기화된다', async ({ page }) => {
    await page.getByRole('button', { name: '계정 삭제' }).click()

    // 체크박스 동의 + 문구 입력
    await clickCheckbox(page)
    await page.getByPlaceholder('삭제하겠습니다').fill('삭제하겠습니다')

    // 취소로 닫기
    await page.getByRole('dialog').getByRole('button', { name: '취소' }).click()

    // 재오픈 후 상태 초기화 확인
    await page.getByRole('button', { name: '계정 삭제' }).click()

    await expect(page.getByRole('checkbox')).not.toBeChecked()
    await expect(page.getByPlaceholder('삭제하겠습니다')).toHaveValue('')
  })
})

test.describe('계정 삭제 — 확인 버튼 활성화 조건', () => {
  test.beforeEach(async ({ page }) => {
    await openDeleteModal(page)
  })

  test('체크박스·문구 모두 미입력 시 "확인" 버튼이 비활성화된다', async ({ page }) => {
    await expect(page.getByRole('dialog').getByRole('button', { name: '확인' })).toBeDisabled()
  })

  test('체크박스만 동의하고 문구 미입력 시 "확인" 버튼이 비활성화된다', async ({ page }) => {
    await clickCheckbox(page)

    await expect(page.getByRole('dialog').getByRole('button', { name: '확인' })).toBeDisabled()
  })

  test('문구만 입력하고 체크박스 미동의 시 "확인" 버튼이 비활성화된다', async ({ page }) => {
    await page.getByPlaceholder('삭제하겠습니다').fill('삭제하겠습니다')

    await expect(page.getByRole('dialog').getByRole('button', { name: '확인' })).toBeDisabled()
  })

  test('잘못된 문구 입력 시 "확인" 버튼이 비활성화된다', async ({ page }) => {
    await clickCheckbox(page)
    await page.getByPlaceholder('삭제하겠습니다').fill('삭제할게요')

    await expect(page.getByRole('dialog').getByRole('button', { name: '확인' })).toBeDisabled()
  })

  test('체크박스 동의 + 올바른 문구 입력 시 "확인" 버튼이 활성화된다', async ({ page }) => {
    await clickCheckbox(page)
    await page.getByPlaceholder('삭제하겠습니다').fill('삭제하겠습니다')

    await expect(page.getByRole('dialog').getByRole('button', { name: '확인' })).toBeEnabled()
  })
})

test.describe('계정 삭제 — 실행', () => {
  test.beforeEach(async ({ page }) => {
    await openDeleteModal(page)
    await clickCheckbox(page)
    await page.getByPlaceholder('삭제하겠습니다').fill('삭제하겠습니다')
  })

  test('삭제 성공 시 /login으로 이동한다', async ({ page }) => {
    await page.getByRole('dialog').getByRole('button', { name: '확인' }).click()

    await page.waitForURL('/login', { timeout: 8_000 })
    await expect(page).toHaveURL('/login')
  })

  test('삭제 실패 시 에러 토스트가 표시되고 모달이 유지된다', async ({ page }) => {
    await page.evaluate(() => {
      const orig = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : String(input)
        const method = input instanceof Request ? input.method : (init?.method ?? 'GET')
        if (url.includes('users/me') && method === 'DELETE') {
          return new Response(
            JSON.stringify({ error_detail: '회원 탈퇴에 실패했습니다.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          )
        }
        return orig(input, init)
      }
    })

    await page.getByRole('dialog').getByRole('button', { name: '확인' }).click()

    await expect(toastLocator(page)).toBeVisible()
    // 삭제 실패 → /login 이동 없이 모달 유지
    await expect(page.getByPlaceholder('삭제하겠습니다')).toBeVisible()
  })

  test('삭제 실패 후 "확인" 버튼이 재활성화된다', async ({ page }) => {
    await page.evaluate(() => {
      const orig = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : String(input)
        const method = input instanceof Request ? input.method : (init?.method ?? 'GET')
        if (url.includes('users/me') && method === 'DELETE') {
          return new Response(null, { status: 500 })
        }
        return orig(input, init)
      }
    })

    const confirmBtn = page.getByRole('dialog').getByRole('button', { name: '확인' })
    await confirmBtn.click()

    await expect(toastLocator(page)).toBeVisible()
    // isPending이 false로 돌아와 버튼 재활성화
    await expect(confirmBtn).toBeEnabled({ timeout: 5_000 })
  })
})
