/**
 * 소셜 로그인 사용자 내 정보 수정 E2E 테스트
 *
 * @interface-contract
 *   API:
 *     - POST   v1/users/token/refresh  → 소셜 JWT (login_type: kakao) 반환
 *     - GET    v1/users/me             → 소셜 사용자 MeDetailResponse
 *     - PATCH  v1/users/me             → 이름·생년월일 수정
 *     - DELETE v1/users/me             → 비밀번호 없이 탈퇴
 *
 * 검증 항목:
 *   1. 레이아웃 — 비밀번호 변경 없음, 이름·생년월일 편집 필드 표시
 *   2. 이름 수정 (미설정 상태): 입력·수정 버튼·확인 모달·성공·실패
 *   3. 생년월일 수정 (미설정 상태): 입력·수정 버튼·확인 모달·성공·실패
 *   4. 이름·생년월일 이미 설정된 경우 — 필드 잠금, 수정 버튼 없음
 *   5. 계정 삭제 — 비밀번호 없이, 체크박스+문구만으로 확인
 */

import { test, expect, type Page } from '@playwright/test'

// -----------------------------------------------------------------------
// 상수
// -----------------------------------------------------------------------

/**
 * 소셜 로그인 JWT (payload: { login_type: 'kakao' })
 * btoa('{"login_type":"kakao"}') = 'eyJsb2dpbl90eXBlIjoia2FrYW8ifQ=='
 * padding 제거 → 'eyJsb2dpbl90eXBlIjoia2FrYW8ifQ'
 */
const SOCIAL_TOKEN = 'mock.eyJsb2dpbl90eXBlIjoia2FrYW8ifQ.sig'

// -----------------------------------------------------------------------
// 헬퍼
// -----------------------------------------------------------------------

/** 에러/성공 토스트 공통 로케이터 */
function toastLocator(page: Page) {
  return page.locator('[role="status"][data-variant]')
}

/**
 * 소셜 사용자 설정 페이지 부트스트랩
 *
 * - token/refresh → 소셜 JWT 반환 (isSocialLoginToken = true)
 * - GET /users/me → window.__socialMe (초기 name/birth_day 제어 가능)
 * - PATCH /users/me → window.__socialMe 갱신 후 반환 (리페치 시 locked 전환)
 */
async function setupSocialSettings(
  page: Page,
  opts: { name?: string; birthDay?: string } = {},
) {
  const { name = '', birthDay = '' } = opts

  await page.addInitScript({
    content: `
      (() => {
        const orig = window.fetch.bind(window)

        // 가변 me 데이터 — PATCH 성공 시 갱신되어 이후 GET에 반영
        window.__socialMe = {
          user_id: 'social_user_001',
          name: ${JSON.stringify(name)},
          email: 'kakao@example.com',
          birth_day: ${JSON.stringify(birthDay)},
          nickname: 'test_nickname',
          profile_img: null,
          intro: null,
          phone_number: null,
          role: 'user',
        }

        window.fetch = async (input, init) => {
          const url    = input instanceof Request ? input.url    : String(input)
          const method = input instanceof Request ? input.method : (init?.method ?? 'GET')

          // token/refresh → 소셜 JWT
          if (url.includes('/users/token/refresh') && method === 'POST') {
            return new Response(
              JSON.stringify({ access_token: '${SOCIAL_TOKEN}' }),
              { status: 200, headers: { 'Content-Type': 'application/json' } },
            )
          }

          // GET /users/me → 현재 소셜 사용자 데이터
          if (url.includes('/users/me') && method === 'GET') {
            return new Response(
              JSON.stringify(window.__socialMe),
              { status: 200, headers: { 'Content-Type': 'application/json' } },
            )
          }

          // DELETE /users/me → 탈퇴 성공 (204 No Content)
          if (url.includes('/users/me') && method === 'DELETE') {
            return new Response(null, { status: 204 })
          }

          // PATCH /users/me → 데이터 갱신 후 반환 (invalidateQueries 리페치 연동)
          if (url.includes('/users/me') && method === 'PATCH') {
            let body = {}
            try {
              const text = input instanceof Request
                ? await input.clone().text()
                : String(init?.body ?? '{}')
              body = JSON.parse(text)
            } catch {}
            Object.assign(window.__socialMe, body)
            return new Response(
              JSON.stringify(window.__socialMe),
              { status: 200, headers: { 'Content-Type': 'application/json' } },
            )
          }

          return orig(input, init)
        }
      })()
    `,
  })

  await page.goto('/settings')
  await expect(page.getByRole('button', { name: '변경사항 저장' })).toBeVisible({ timeout: 15_000 })
}

// -----------------------------------------------------------------------
// 1. 레이아웃
// -----------------------------------------------------------------------
test.describe('소셜 로그인 — 레이아웃', () => {
  test.beforeEach(async ({ page }) => {
    await setupSocialSettings(page)
  })

  test('비밀번호 변경 항목이 없다', async ({ page }) => {
    await expect(page.getByText('비밀번호 변경')).not.toBeVisible()
  })

  test('이름 입력 필드가 표시된다', async ({ page }) => {
    await expect(page.getByPlaceholder('실명을 입력해주세요')).toBeVisible()
  })

  test('생년월일 입력 필드(YYYY / MM / DD)가 표시된다', async ({ page }) => {
    await expect(page.getByLabel('출생 연도')).toBeVisible()
    await expect(page.getByLabel('출생 월')).toBeVisible()
    await expect(page.getByLabel('출생 일')).toBeVisible()
  })

  test('계정 삭제 버튼이 하단 저장 바에 표시된다', async ({ page }) => {
    await expect(page.getByRole('button', { name: '계정 삭제' })).toBeVisible()
  })
})

// -----------------------------------------------------------------------
// 2. 이름 수정 — 미설정 상태 (name = "")
//    생년월일은 이미 설정(locked)해 수정 버튼이 1개만 노출되도록 제어
// -----------------------------------------------------------------------
test.describe('소셜 로그인 — 이름 수정 (미설정)', () => {
  test.beforeEach(async ({ page }) => {
    await setupSocialSettings(page, { name: '', birthDay: '1990-01-05' })
  })

  test('이름 필드가 활성화되고 수정 버튼이 표시된다', async ({ page }) => {
    await expect(page.getByPlaceholder('실명을 입력해주세요')).toBeEnabled()
    await expect(page.getByRole('button', { name: '수정' })).toBeVisible()
  })

  test('이름 미입력 시 수정 버튼이 비활성화된다', async ({ page }) => {
    await expect(page.getByRole('button', { name: '수정' })).toBeDisabled()
  })

  test('이름 입력 후 수정 버튼이 활성화된다', async ({ page }) => {
    await page.getByPlaceholder('실명을 입력해주세요').fill('홍길동')
    await expect(page.getByRole('button', { name: '수정' })).toBeEnabled()
  })

  test('수정 버튼 클릭 시 확인 모달이 표시된다', async ({ page }) => {
    await page.getByPlaceholder('실명을 입력해주세요').fill('홍길동')
    await page.getByRole('button', { name: '수정' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('확인 모달에서 취소하면 모달이 닫히고 이름 필드가 유지된다', async ({ page }) => {
    await page.getByPlaceholder('실명을 입력해주세요').fill('홍길동')
    await page.getByRole('button', { name: '수정' }).click()
    await page.getByRole('dialog').getByRole('button', { name: '취소' }).click()

    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page.getByPlaceholder('실명을 입력해주세요')).toHaveValue('홍길동')
  })

  test('이름 저장 성공 시 모달이 닫히고 이름 필드가 잠긴다', async ({ page }) => {
    await page.getByPlaceholder('실명을 입력해주세요').fill('홍길동')
    await page.getByRole('button', { name: '수정' }).click()
    await page.getByRole('dialog').getByRole('button', { name: '확인' }).click()

    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5_000 })
    await expect(page.getByPlaceholder('실명을 입력해주세요')).toBeDisabled({ timeout: 5_000 })
    // 잠긴 후 수정 버튼 없음 (이름·생년월일 모두 locked)
    await expect(page.getByRole('button', { name: '수정' })).not.toBeVisible()
  })

  test('이름 저장 실패 시 에러 토스트가 표시되고 모달이 유지된다', async ({ page }) => {
    await page.evaluate(() => {
      const orig = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url    = input instanceof Request ? input.url    : String(input)
        const method = input instanceof Request ? input.method : (init?.method ?? 'GET')
        if (url.includes('/users/me') && method === 'PATCH') {
          return new Response(null, { status: 500 })
        }
        return orig(input, init)
      }
    })

    await page.getByPlaceholder('실명을 입력해주세요').fill('홍길동')
    await page.getByRole('button', { name: '수정' }).click()
    await page.getByRole('dialog').getByRole('button', { name: '확인' }).click()

    await expect(toastLocator(page)).toBeVisible({ timeout: 5_000 })
    // 실패 → 모달 유지, 필드 여전히 활성화
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByPlaceholder('실명을 입력해주세요')).toBeEnabled()
  })

  test('이름 저장 실패 후 확인 버튼이 재활성화된다', async ({ page }) => {
    await page.evaluate(() => {
      const orig = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url    = input instanceof Request ? input.url    : String(input)
        const method = input instanceof Request ? input.method : (init?.method ?? 'GET')
        if (url.includes('/users/me') && method === 'PATCH') {
          return new Response(null, { status: 500 })
        }
        return orig(input, init)
      }
    })

    await page.getByPlaceholder('실명을 입력해주세요').fill('홍길동')
    await page.getByRole('button', { name: '수정' }).click()
    const confirmBtn = page.getByRole('dialog').getByRole('button', { name: '확인' })
    await confirmBtn.click()

    await expect(toastLocator(page)).toBeVisible({ timeout: 5_000 })
    await expect(confirmBtn).toBeEnabled({ timeout: 5_000 })
  })
})

// -----------------------------------------------------------------------
// 3. 생년월일 수정 — 미설정 상태 (birth_day = "")
//    이름은 이미 설정(locked)해 수정 버튼이 1개만 노출되도록 제어
// -----------------------------------------------------------------------
test.describe('소셜 로그인 — 생년월일 수정 (미설정)', () => {
  test.beforeEach(async ({ page }) => {
    await setupSocialSettings(page, { name: '홍길동', birthDay: '' })
  })

  test('생년월일 필드가 활성화되고 수정 버튼이 표시된다', async ({ page }) => {
    await expect(page.getByLabel('출생 연도')).toBeEnabled()
    await expect(page.getByRole('button', { name: '수정' })).toBeVisible()
  })

  test('날짜 미입력 시 수정 버튼이 비활성화된다', async ({ page }) => {
    await expect(page.getByRole('button', { name: '수정' })).toBeDisabled()
  })

  test('유효하지 않은 날짜(월=13) 입력 시 수정 버튼이 비활성화된다', async ({ page }) => {
    await page.getByLabel('출생 연도').fill('1990')
    await page.getByLabel('출생 월').fill('13')
    await page.getByLabel('출생 일').fill('5')

    await expect(page.getByRole('button', { name: '수정' })).toBeDisabled()
  })

  test('유효한 날짜 입력 후 수정 버튼이 활성화된다', async ({ page }) => {
    await page.getByLabel('출생 연도').fill('1990')
    await page.getByLabel('출생 월').fill('1')
    await page.getByLabel('출생 일').fill('5')

    await expect(page.getByRole('button', { name: '수정' })).toBeEnabled()
  })

  test('수정 버튼 클릭 시 확인 모달이 표시된다', async ({ page }) => {
    await page.getByLabel('출생 연도').fill('1990')
    await page.getByLabel('출생 월').fill('1')
    await page.getByLabel('출생 일').fill('5')
    await page.getByRole('button', { name: '수정' }).click()

    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('확인 모달에서 취소하면 모달이 닫힌다', async ({ page }) => {
    await page.getByLabel('출생 연도').fill('1990')
    await page.getByLabel('출생 월').fill('1')
    await page.getByLabel('출생 일').fill('5')
    await page.getByRole('button', { name: '수정' }).click()
    await page.getByRole('dialog').getByRole('button', { name: '취소' }).click()

    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page.getByLabel('출생 연도')).toHaveValue('1990')
  })

  test('생년월일 저장 성공 시 모달이 닫히고 생년월일 필드가 잠긴다', async ({ page }) => {
    await page.getByLabel('출생 연도').fill('1990')
    await page.getByLabel('출생 월').fill('1')
    await page.getByLabel('출생 일').fill('5')
    await page.getByRole('button', { name: '수정' }).click()
    await page.getByRole('dialog').getByRole('button', { name: '확인' }).click()

    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5_000 })
    await expect(page.getByLabel('출생 연도')).toBeDisabled({ timeout: 5_000 })
    await expect(page.getByLabel('출생 월')).toBeDisabled()
    await expect(page.getByLabel('출생 일')).toBeDisabled()
    // 이름·생년월일 모두 locked → 수정 버튼 없음
    await expect(page.getByRole('button', { name: '수정' })).not.toBeVisible()
  })

  test('생년월일 저장 실패 시 에러 토스트가 표시되고 모달이 유지된다', async ({ page }) => {
    await page.evaluate(() => {
      const orig = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url    = input instanceof Request ? input.url    : String(input)
        const method = input instanceof Request ? input.method : (init?.method ?? 'GET')
        if (url.includes('/users/me') && method === 'PATCH') {
          return new Response(null, { status: 500 })
        }
        return orig(input, init)
      }
    })

    await page.getByLabel('출생 연도').fill('1990')
    await page.getByLabel('출생 월').fill('1')
    await page.getByLabel('출생 일').fill('5')
    await page.getByRole('button', { name: '수정' }).click()
    await page.getByRole('dialog').getByRole('button', { name: '확인' }).click()

    await expect(toastLocator(page)).toBeVisible({ timeout: 5_000 })
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByLabel('출생 연도')).toBeEnabled()
  })
})

// -----------------------------------------------------------------------
// 4. 이름·생년월일 이미 설정된 경우 — 필드 잠금
// -----------------------------------------------------------------------
test.describe('소셜 로그인 — 이름·생년월일 이미 설정', () => {
  test.beforeEach(async ({ page }) => {
    await setupSocialSettings(page, { name: '홍길동', birthDay: '1990-01-05' })
  })

  test('이름 필드가 비활성화(locked)된다', async ({ page }) => {
    await expect(page.getByPlaceholder('실명을 입력해주세요')).toBeDisabled()
  })

  test('생년월일 모든 필드가 비활성화(locked)된다', async ({ page }) => {
    await expect(page.getByLabel('출생 연도')).toBeDisabled()
    await expect(page.getByLabel('출생 월')).toBeDisabled()
    await expect(page.getByLabel('출생 일')).toBeDisabled()
  })

  test('이름·생년월일 수정 버튼이 표시되지 않는다', async ({ page }) => {
    await expect(page.getByRole('button', { name: '수정' })).not.toBeVisible()
  })
})

// -----------------------------------------------------------------------
// 5. 계정 삭제 — 소셜 로그인 (비밀번호 없이)
// -----------------------------------------------------------------------
test.describe('소셜 로그인 — 계정 삭제', () => {
  async function openDeleteModal(page: Page) {
    await setupSocialSettings(page)
    await page.getByRole('button', { name: '계정 삭제' }).click()
    await expect(page.getByPlaceholder('삭제하겠습니다')).toBeVisible()
  }

  function clickCheckbox(page: Page) {
    return page
      .getByRole('dialog')
      .locator('label')
      .filter({ hasText: '계정 삭제에 동의합니다.' })
      .click()
  }

  test('비밀번호 입력 필드가 없다', async ({ page }) => {
    await openDeleteModal(page)
    await expect(page.getByPlaceholder('비밀번호를 입력해 주세요')).not.toBeVisible()
  })

  test('체크박스·문구 미입력 시 확인 버튼이 비활성화된다', async ({ page }) => {
    await openDeleteModal(page)
    await expect(page.getByRole('dialog').getByRole('button', { name: '확인' })).toBeDisabled()
  })

  test('체크박스만 동의하고 문구 미입력 시 확인 버튼이 비활성화된다', async ({ page }) => {
    await openDeleteModal(page)
    await clickCheckbox(page)
    await expect(page.getByRole('dialog').getByRole('button', { name: '확인' })).toBeDisabled()
  })

  test('문구만 입력하고 체크박스 미동의 시 확인 버튼이 비활성화된다', async ({ page }) => {
    await openDeleteModal(page)
    await page.getByPlaceholder('삭제하겠습니다').fill('삭제하겠습니다')
    await expect(page.getByRole('dialog').getByRole('button', { name: '확인' })).toBeDisabled()
  })

  test('잘못된 문구 입력 시 확인 버튼이 비활성화된다', async ({ page }) => {
    await openDeleteModal(page)
    await clickCheckbox(page)
    await page.getByPlaceholder('삭제하겠습니다').fill('삭제할게요')
    await expect(page.getByRole('dialog').getByRole('button', { name: '확인' })).toBeDisabled()
  })

  test('체크박스 동의 + 올바른 문구 입력만으로 확인 버튼이 활성화된다 (비밀번호 불필요)', async ({ page }) => {
    await openDeleteModal(page)
    await clickCheckbox(page)
    await page.getByPlaceholder('삭제하겠습니다').fill('삭제하겠습니다')
    await expect(page.getByRole('dialog').getByRole('button', { name: '확인' })).toBeEnabled()
  })

  test('삭제 성공 시 /login으로 이동한다', async ({ page }) => {
    await openDeleteModal(page)
    await clickCheckbox(page)
    await page.getByPlaceholder('삭제하겠습니다').fill('삭제하겠습니다')
    await page.getByRole('dialog').getByRole('button', { name: '확인' }).click()

    await page.waitForURL('/login', { timeout: 8_000 })
    await expect(page).toHaveURL('/login')
  })

  test('삭제 실패 시 에러 토스트가 표시되고 모달이 유지된다', async ({ page }) => {
    await openDeleteModal(page)

    await page.evaluate(() => {
      const orig = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url    = input instanceof Request ? input.url    : String(input)
        const method = input instanceof Request ? input.method : (init?.method ?? 'GET')
        if (url.includes('/users/me') && method === 'DELETE') {
          return new Response(
            JSON.stringify({ error_detail: '탈퇴에 실패했습니다.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          )
        }
        return orig(input, init)
      }
    })

    await clickCheckbox(page)
    await page.getByPlaceholder('삭제하겠습니다').fill('삭제하겠습니다')
    await page.getByRole('dialog').getByRole('button', { name: '확인' }).click()

    await expect(toastLocator(page)).toBeVisible({ timeout: 5_000 })
    await expect(page.getByPlaceholder('삭제하겠습니다')).toBeVisible()
  })

  test('삭제 실패 후 확인 버튼이 재활성화된다', async ({ page }) => {
    await openDeleteModal(page)

    await page.evaluate(() => {
      const orig = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url    = input instanceof Request ? input.url    : String(input)
        const method = input instanceof Request ? input.method : (init?.method ?? 'GET')
        if (url.includes('/users/me') && method === 'DELETE') {
          return new Response(null, { status: 500 })
        }
        return orig(input, init)
      }
    })

    await clickCheckbox(page)
    await page.getByPlaceholder('삭제하겠습니다').fill('삭제하겠습니다')
    const confirmBtn = page.getByRole('dialog').getByRole('button', { name: '확인' })
    await confirmBtn.click()

    await expect(toastLocator(page)).toBeVisible({ timeout: 5_000 })
    await expect(confirmBtn).toBeEnabled({ timeout: 5_000 })
  })

  test('모달 닫기 후 재오픈 시 상태가 초기화된다', async ({ page }) => {
    await openDeleteModal(page)
    await clickCheckbox(page)
    await page.getByPlaceholder('삭제하겠습니다').fill('삭제하겠습니다')

    await page.getByRole('dialog').getByRole('button', { name: '취소' }).click()
    await page.getByRole('button', { name: '계정 삭제' }).click()

    await expect(page.getByRole('checkbox')).not.toBeChecked()
    await expect(page.getByPlaceholder('삭제하겠습니다')).toHaveValue('')
  })
})
