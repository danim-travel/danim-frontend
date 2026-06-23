/**
 * 소셜 로그인 사용자 — 이름 · 생년월일 1회 저장 및 고정 UI E2E
 *
 * 검증 범위
 *  1. 레이아웃 — 소셜 전용 필드 노출 여부
 *  2. 이름 저장 성공 플로우
 *  3. 이름 저장 실패 플로우
 *  4. 생년월일 저장 성공 플로우
 *  5. 생년월일 저장 실패 플로우
 *  6. 독립 잠금 — 하나만 저장 시 나머지는 수정 가능
 *  7. 통합 플로우 — 이름 → 생년월일 순차 저장 후 전체 고정
 *  8. localStorage 영속성 — 이전 세션 저장 이력이 페이지 진입 시 반영
 *
 * 잠금 기준
 *  - 서버 응답의 값 존재 여부가 아닌 localStorage 플래그로 판단한다.
 *  - 잠금 키: danim_social_name_saved_{userId} / danim_social_birth_day_saved_{userId}
 *  - 잠금 UI: <input> / 저장 버튼이 사라지고 읽기 전용 <span> 텍스트로 교체된다.
 *
 * 소셜 판별 토큰
 *  SOCIAL_TOKEN payload = {"login_type":"kakao"}
 *  → authStore.loginType = 'kakao' → isSocial = true
 */

import { test, expect, type Page } from '@playwright/test'

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────

const USER_ID      = 'social_user_001'
const SOCIAL_TOKEN = 'mock.eyJsb2dpbl90eXBlIjoia2FrYW8ifQ.sig'

const STORAGE_KEY_NAME  = `danim_social_name_saved_${USER_ID}`
const STORAGE_KEY_BIRTH = `danim_social_birth_day_saved_${USER_ID}`

// ─────────────────────────────────────────────
// 헬퍼
// ─────────────────────────────────────────────

function toastLocator(page: Page) {
  return page.locator('[role="status"][data-variant]')
}

/**
 * 소셜 사용자 설정 페이지 셋업
 *
 * @param name        서버에서 내려오는 초기 이름 ('' = 미설정)
 * @param birthDay    서버에서 내려오는 초기 생년월일 ('' = 미설정, 'YYYY-MM-DD' = 설정됨)
 * @param nameSaved   localStorage에 이름 저장 이력 플래그를 미리 심는다 (이전 세션 시뮬레이션)
 * @param birthDaySaved 생년월일 저장 이력 플래그를 미리 심는다
 */
async function setupSocialSettings(
  page: Page,
  opts: {
    name?: string
    birthDay?: string
    nameSaved?: boolean
    birthDaySaved?: boolean
  } = {},
) {
  const { name = '', birthDay = '', nameSaved = false, birthDaySaved = false } = opts

  // ① localStorage 사전 세팅 (addInitScript는 매 navigation 직전 실행된다)
  await page.addInitScript({
    content: `
      if (${nameSaved})     window.localStorage.setItem('${STORAGE_KEY_NAME}',  '1')
      if (${birthDaySaved}) window.localStorage.setItem('${STORAGE_KEY_BIRTH}', '1')
    `,
  })

  // ② fetch 목 — token/refresh · GET · PATCH /users/me
  await page.addInitScript({
    content: `
      (() => {
        const orig = window.fetch.bind(window)

        // 가변 me 데이터 (PATCH 성공 시 갱신)
        window.__socialMe = {
          user_id:      '${USER_ID}',
          name:         ${JSON.stringify(name)},
          email:        'kakao@example.com',
          birth_day:    ${JSON.stringify(birthDay)},
          nickname:     'test_nickname',
          profile_img:  null,
          intro:        null,
          phone_number: null,
        }

        window.fetch = async (input, init) => {
          const url    = input instanceof Request ? input.url    : String(input)
          const method = input instanceof Request ? input.method : (init?.method ?? 'GET')

          // silent refresh → 소셜 JWT 반환
          if (url.includes('/users/token/refresh') && method === 'POST') {
            return new Response(
              JSON.stringify({ access_token: '${SOCIAL_TOKEN}' }),
              { status: 200, headers: { 'Content-Type': 'application/json' } },
            )
          }

          // 내 정보 조회
          if (url.includes('/users/me') && method === 'GET') {
            return new Response(
              JSON.stringify(window.__socialMe),
              { status: 200, headers: { 'Content-Type': 'application/json' } },
            )
          }

          // 내 정보 수정 → 변경 값 병합 후 반환 (invalidateQueries 리페치 연동)
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

          if (url.includes('/users/me') && method === 'DELETE') {
            return new Response(null, { status: 204 })
          }

          return orig(input, init)
        }
      })()
    `,
  })

  await page.goto('/settings')
  await expect(page.getByRole('button', { name: '변경사항 저장' })).toBeVisible({ timeout: 15_000 })
}

/** PATCH /users/me를 500으로 교체 (저장 실패 시뮬레이션) */
async function mockPatchError(page: Page) {
  await page.evaluate(() => {
    const orig = window.fetch.bind(window)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url    = input instanceof Request ? input.url    : String(input)
      const method = input instanceof Request ? input.method : (init?.method ?? 'GET')
      if (url.includes('/users/me') && method === 'PATCH') {
        return new Response(
          JSON.stringify({ error_detail: '서버 오류가 발생했습니다.' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return orig(input, init)
    }
  })
}

// ─────────────────────────────────────────────
// 1. 레이아웃
// ─────────────────────────────────────────────
test.describe('소셜 로그인 — 레이아웃', () => {
  test.beforeEach(async ({ page }) => setupSocialSettings(page))

  test('비밀번호 변경 항목이 없다', async ({ page }) => {
    await expect(page.getByText('비밀번호 변경')).not.toBeVisible()
  })

  test('이름 입력 필드가 표시된다', async ({ page }) => {
    await expect(page.getByPlaceholder('실명을 입력해주세요')).toBeVisible()
  })

  test('생년월일 입력 필드(YYYY/MM/DD)가 표시된다', async ({ page }) => {
    await expect(page.getByLabel('출생 연도')).toBeVisible()
    await expect(page.getByLabel('출생 월')).toBeVisible()
    await expect(page.getByLabel('출생 일')).toBeVisible()
  })

  test('이름/생년월일 모두 미저장이면 저장 버튼이 2개 표시된다', async ({ page }) => {
    await expect(page.getByRole('button', { name: '저장', exact: true })).toHaveCount(2)
  })

  test('계정 삭제 버튼이 하단에 표시된다', async ({ page }) => {
    await expect(page.getByRole('button', { name: '계정 삭제' })).toBeVisible()
  })
})

// ─────────────────────────────────────────────
// 2. 이름 저장 — 성공 플로우
//    (생년월일을 localStorage로 고정 → 화면에 저장 버튼 1개)
// ─────────────────────────────────────────────
test.describe('소셜 로그인 — 이름 저장 (성공)', () => {
  test.beforeEach(async ({ page }) => {
    await setupSocialSettings(page, {
      birthDay: '1990-01-05',
      birthDaySaved: true,   // 생년월일은 이미 잠금
    })
  })

  test('이름 미입력 시 저장 버튼이 비활성화된다', async ({ page }) => {
    await expect(page.getByRole('button', { name: '저장', exact: true })).toBeDisabled()
  })

  test('이름 입력 후 저장 버튼이 활성화된다', async ({ page }) => {
    await page.getByPlaceholder('실명을 입력해주세요').fill('홍길동')
    await expect(page.getByRole('button', { name: '저장', exact: true })).toBeEnabled()
  })

  test('저장 버튼 클릭 시 "이름은 다시 변경할 수 없습니다." 모달이 표시된다', async ({ page }) => {
    await page.getByPlaceholder('실명을 입력해주세요').fill('홍길동')
    await page.getByRole('button', { name: '저장', exact: true }).click()

    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('이름은 다시 변경할 수 없습니다.')).toBeVisible()
  })

  test('모달 취소 시 모달이 닫히고 입력 필드가 유지된다', async ({ page }) => {
    await page.getByPlaceholder('실명을 입력해주세요').fill('홍길동')
    await page.getByRole('button', { name: '저장', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: '취소' }).click()

    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page.getByPlaceholder('실명을 입력해주세요')).toHaveValue('홍길동')
  })

  test('모달 확인 후 이름 입력 필드와 저장 버튼이 사라진다', async ({ page }) => {
    await page.getByPlaceholder('실명을 입력해주세요').fill('홍길동')
    await page.getByRole('button', { name: '저장', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: '확인' }).click()

    await expect(page.getByPlaceholder('실명을 입력해주세요')).not.toBeVisible({ timeout: 5_000 })
    await expect(page.getByRole('button', { name: '저장', exact: true })).toHaveCount(0)
  })

  test('모달 확인 후 저장한 이름이 읽기 전용 텍스트로 표시된다', async ({ page }) => {
    await page.getByPlaceholder('실명을 입력해주세요').fill('홍길동')
    await page.getByRole('button', { name: '저장', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: '확인' }).click()

    await expect(page.getByPlaceholder('실명을 입력해주세요')).not.toBeVisible({ timeout: 5_000 })
    await expect(page.getByText('홍길동')).toBeVisible()
  })
})

// ─────────────────────────────────────────────
// 3. 이름 저장 — 실패 플로우
// ─────────────────────────────────────────────
test.describe('소셜 로그인 — 이름 저장 (실패)', () => {
  test.beforeEach(async ({ page }) => {
    await setupSocialSettings(page, {
      birthDay: '1990-01-05',
      birthDaySaved: true,
    })
  })

  test('저장 실패 시 에러 토스트가 표시된다', async ({ page }) => {
    await mockPatchError(page)
    await page.getByPlaceholder('실명을 입력해주세요').fill('홍길동')
    await page.getByRole('button', { name: '저장', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: '확인' }).click()

    await expect(toastLocator(page)).toBeVisible({ timeout: 5_000 })
  })

  test('저장 실패 시 확인 모달이 열린 채로 유지된다', async ({ page }) => {
    await mockPatchError(page)
    await page.getByPlaceholder('실명을 입력해주세요').fill('홍길동')
    await page.getByRole('button', { name: '저장', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: '확인' }).click()

    await expect(toastLocator(page)).toBeVisible({ timeout: 5_000 })
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('저장 실패 시 이름 입력 필드가 여전히 활성화되어 있다', async ({ page }) => {
    await mockPatchError(page)
    await page.getByPlaceholder('실명을 입력해주세요').fill('홍길동')
    await page.getByRole('button', { name: '저장', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: '확인' }).click()

    await expect(toastLocator(page)).toBeVisible({ timeout: 5_000 })
    await expect(page.getByPlaceholder('실명을 입력해주세요')).toBeEnabled()
  })

  test('저장 실패 후 확인 버튼이 재활성화된다', async ({ page }) => {
    await mockPatchError(page)
    await page.getByPlaceholder('실명을 입력해주세요').fill('홍길동')
    await page.getByRole('button', { name: '저장', exact: true }).click()
    const confirmBtn = page.getByRole('dialog').getByRole('button', { name: '확인' })
    await confirmBtn.click()

    await expect(toastLocator(page)).toBeVisible({ timeout: 5_000 })
    await expect(confirmBtn).toBeEnabled({ timeout: 5_000 })
  })

  test('저장 실패 후 이름 필드가 잠기지 않는다 (localStorage 플래그 미설정)', async ({ page }) => {
    await mockPatchError(page)
    await page.getByPlaceholder('실명을 입력해주세요').fill('홍길동')
    await page.getByRole('button', { name: '저장', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: '확인' }).click()

    await expect(toastLocator(page)).toBeVisible({ timeout: 5_000 })
    // 잠금 UI 전환이 없어야 한다
    await expect(page.getByPlaceholder('실명을 입력해주세요')).toBeVisible()
    await expect(page.getByRole('button', { name: '저장', exact: true })).toHaveCount(1)
  })
})

// ─────────────────────────────────────────────
// 4. 생년월일 저장 — 성공 플로우
//    (이름을 localStorage로 고정 → 저장 버튼 1개)
// ─────────────────────────────────────────────
test.describe('소셜 로그인 — 생년월일 저장 (성공)', () => {
  test.beforeEach(async ({ page }) => {
    await setupSocialSettings(page, {
      name: '홍길동',
      nameSaved: true,   // 이름은 이미 잠금
    })
  })

  test('날짜 미입력 시 저장 버튼이 비활성화된다', async ({ page }) => {
    await expect(page.getByRole('button', { name: '저장', exact: true })).toBeDisabled()
  })

  test('연도 자리수 부족(3자리) 입력 시 저장 버튼이 비활성화된다', async ({ page }) => {
    await page.getByLabel('출생 연도').fill('199')
    await page.getByLabel('출생 월').fill('1')
    await page.getByLabel('출생 일').fill('5')
    await expect(page.getByRole('button', { name: '저장', exact: true })).toBeDisabled()
  })

  test('유효하지 않은 월(13) 입력 시 저장 버튼이 비활성화된다', async ({ page }) => {
    await page.getByLabel('출생 연도').fill('1990')
    await page.getByLabel('출생 월').fill('13')
    await page.getByLabel('출생 일').fill('5')
    await expect(page.getByRole('button', { name: '저장', exact: true })).toBeDisabled()
  })

  test('유효하지 않은 일(32) 입력 시 저장 버튼이 비활성화된다', async ({ page }) => {
    await page.getByLabel('출생 연도').fill('1990')
    await page.getByLabel('출생 월').fill('1')
    await page.getByLabel('출생 일').fill('32')
    await expect(page.getByRole('button', { name: '저장', exact: true })).toBeDisabled()
  })

  test('유효한 날짜 입력 후 저장 버튼이 활성화된다', async ({ page }) => {
    await page.getByLabel('출생 연도').fill('1990')
    await page.getByLabel('출생 월').fill('1')
    await page.getByLabel('출생 일').fill('5')
    await expect(page.getByRole('button', { name: '저장', exact: true })).toBeEnabled()
  })

  test('저장 버튼 클릭 시 "생년월일은 다시 변경할 수 없습니다." 모달이 표시된다', async ({ page }) => {
    await page.getByLabel('출생 연도').fill('1990')
    await page.getByLabel('출생 월').fill('1')
    await page.getByLabel('출생 일').fill('5')
    await page.getByRole('button', { name: '저장', exact: true }).click()

    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('생년월일은 다시 변경할 수 없습니다.')).toBeVisible()
  })

  test('모달 취소 시 모달이 닫히고 입력 값이 유지된다', async ({ page }) => {
    await page.getByLabel('출생 연도').fill('1990')
    await page.getByLabel('출생 월').fill('1')
    await page.getByLabel('출생 일').fill('5')
    await page.getByRole('button', { name: '저장', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: '취소' }).click()

    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page.getByLabel('출생 연도')).toHaveValue('1990')
    await expect(page.getByLabel('출생 월')).toHaveValue('1')
    await expect(page.getByLabel('출생 일')).toHaveValue('5')
  })

  test('모달 확인 후 생년월일 입력 필드와 저장 버튼이 사라진다', async ({ page }) => {
    await page.getByLabel('출생 연도').fill('1990')
    await page.getByLabel('출생 월').fill('1')
    await page.getByLabel('출생 일').fill('5')
    await page.getByRole('button', { name: '저장', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: '확인' }).click()

    await expect(page.getByLabel('출생 연도')).not.toBeVisible({ timeout: 5_000 })
    await expect(page.getByLabel('출생 월')).not.toBeVisible()
    await expect(page.getByLabel('출생 일')).not.toBeVisible()
    await expect(page.getByRole('button', { name: '저장', exact: true })).toHaveCount(0)
  })

  test('모달 확인 후 저장한 생년월일이 읽기 전용 텍스트로 표시된다', async ({ page }) => {
    await page.getByLabel('출생 연도').fill('1990')
    await page.getByLabel('출생 월').fill('1')
    await page.getByLabel('출생 일').fill('5')
    await page.getByRole('button', { name: '저장', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: '확인' }).click()

    await expect(page.getByLabel('출생 연도')).not.toBeVisible({ timeout: 5_000 })
    await expect(page.getByText(/1990년/)).toBeVisible()
  })
})

// ─────────────────────────────────────────────
// 5. 생년월일 저장 — 실패 플로우
// ─────────────────────────────────────────────
test.describe('소셜 로그인 — 생년월일 저장 (실패)', () => {
  test.beforeEach(async ({ page }) => {
    await setupSocialSettings(page, { name: '홍길동', nameSaved: true })
  })

  async function fillBirthDate(page: Page) {
    await page.getByLabel('출생 연도').fill('1990')
    await page.getByLabel('출생 월').fill('1')
    await page.getByLabel('출생 일').fill('5')
  }

  test('저장 실패 시 에러 토스트가 표시된다', async ({ page }) => {
    await mockPatchError(page)
    await fillBirthDate(page)
    await page.getByRole('button', { name: '저장', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: '확인' }).click()

    await expect(toastLocator(page)).toBeVisible({ timeout: 5_000 })
  })

  test('저장 실패 시 확인 모달이 열린 채로 유지된다', async ({ page }) => {
    await mockPatchError(page)
    await fillBirthDate(page)
    await page.getByRole('button', { name: '저장', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: '확인' }).click()

    await expect(toastLocator(page)).toBeVisible({ timeout: 5_000 })
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('저장 실패 시 생년월일 입력 필드가 계속 활성화된다', async ({ page }) => {
    await mockPatchError(page)
    await fillBirthDate(page)
    await page.getByRole('button', { name: '저장', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: '확인' }).click()

    await expect(toastLocator(page)).toBeVisible({ timeout: 5_000 })
    await expect(page.getByLabel('출생 연도')).toBeEnabled()
    await expect(page.getByLabel('출생 월')).toBeEnabled()
    await expect(page.getByLabel('출생 일')).toBeEnabled()
  })

  test('저장 실패 후 확인 버튼이 재활성화된다', async ({ page }) => {
    await mockPatchError(page)
    await fillBirthDate(page)
    await page.getByRole('button', { name: '저장', exact: true }).click()
    const confirmBtn = page.getByRole('dialog').getByRole('button', { name: '확인' })
    await confirmBtn.click()

    await expect(toastLocator(page)).toBeVisible({ timeout: 5_000 })
    await expect(confirmBtn).toBeEnabled({ timeout: 5_000 })
  })

  test('저장 실패 후 생년월일 필드가 잠기지 않는다', async ({ page }) => {
    await mockPatchError(page)
    await fillBirthDate(page)
    await page.getByRole('button', { name: '저장', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: '확인' }).click()

    await expect(toastLocator(page)).toBeVisible({ timeout: 5_000 })
    await expect(page.getByLabel('출생 연도')).toBeVisible()
    await expect(page.getByRole('button', { name: '저장', exact: true })).toHaveCount(1)
  })
})

// ─────────────────────────────────────────────
// 6. 독립 잠금
// ─────────────────────────────────────────────
test.describe('소셜 로그인 — 독립 잠금: 이름만 저장된 경우', () => {
  test.beforeEach(async ({ page }) => {
    await setupSocialSettings(page, { name: '홍길동', nameSaved: true })
  })

  test('이름 입력 필드가 없고 저장된 이름이 텍스트로 표시된다', async ({ page }) => {
    await expect(page.getByPlaceholder('실명을 입력해주세요')).not.toBeVisible()
    await expect(page.getByText('홍길동')).toBeVisible()
  })

  test('생년월일 입력 필드는 여전히 활성화되어 있다', async ({ page }) => {
    await expect(page.getByLabel('출생 연도')).toBeEnabled()
    await expect(page.getByLabel('출생 월')).toBeEnabled()
    await expect(page.getByLabel('출생 일')).toBeEnabled()
  })

  test('생년월일 저장 버튼만 1개 표시된다', async ({ page }) => {
    await expect(page.getByRole('button', { name: '저장', exact: true })).toHaveCount(1)
  })
})

test.describe('소셜 로그인 — 독립 잠금: 생년월일만 저장된 경우', () => {
  test.beforeEach(async ({ page }) => {
    await setupSocialSettings(page, { birthDay: '1990-01-05', birthDaySaved: true })
  })

  test('생년월일 입력 필드가 없고 저장된 날짜가 텍스트로 표시된다', async ({ page }) => {
    await expect(page.getByLabel('출생 연도')).not.toBeVisible()
    await expect(page.getByText(/1990년/)).toBeVisible()
  })

  test('이름 입력 필드는 여전히 활성화되어 있다', async ({ page }) => {
    await expect(page.getByPlaceholder('실명을 입력해주세요')).toBeEnabled()
  })

  test('이름 저장 버튼만 1개 표시된다', async ({ page }) => {
    await expect(page.getByRole('button', { name: '저장', exact: true })).toHaveCount(1)
  })
})

// ─────────────────────────────────────────────
// 7. 통합 플로우 — 이름 → 생년월일 순차 저장 후 전체 고정
// ─────────────────────────────────────────────
test.describe('소셜 로그인 — 통합 플로우', () => {
  test('이름 저장 → 생년월일 저장 → 모든 입력 필드와 저장 버튼이 사라진다', async ({ page }) => {
    await setupSocialSettings(page)

    // Step 1: 이름 저장
    await page.getByPlaceholder('실명을 입력해주세요').fill('홍길동')
    // 저장 버튼이 2개이므로 이름 필드 옆 첫 번째 버튼 사용
    await page.getByRole('button', { name: '저장', exact: true }).first().click()
    await page.getByRole('dialog').getByRole('button', { name: '확인' }).click()

    // 이름 고정 확인
    await expect(page.getByPlaceholder('실명을 입력해주세요')).not.toBeVisible({ timeout: 5_000 })
    await expect(page.getByText('홍길동')).toBeVisible()
    // 생년월일은 여전히 수정 가능
    await expect(page.getByLabel('출생 연도')).toBeEnabled()
    await expect(page.getByRole('button', { name: '저장', exact: true })).toHaveCount(1)

    // Step 2: 생년월일 저장
    await page.getByLabel('출생 연도').fill('1990')
    await page.getByLabel('출생 월').fill('1')
    await page.getByLabel('출생 일').fill('5')
    await page.getByRole('button', { name: '저장', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: '확인' }).click()

    // 생년월일 고정 확인
    await expect(page.getByLabel('출생 연도')).not.toBeVisible({ timeout: 5_000 })
    await expect(page.getByText(/1990년/)).toBeVisible()

    // 전체 고정 — 저장 버튼 0개
    await expect(page.getByRole('button', { name: '저장', exact: true })).toHaveCount(0)
    // 이름 텍스트도 유지
    await expect(page.getByText('홍길동')).toBeVisible()
  })
})

// ─────────────────────────────────────────────
// 8. localStorage 영속성
//    "이전 세션에서 저장한 이력"을 addInitScript로 시뮬레이션
// ─────────────────────────────────────────────
test.describe('소셜 로그인 — localStorage 영속성', () => {
  test('이름 저장 이력이 있으면 페이지 진입 시 이름 입력 필드가 없다', async ({ page }) => {
    await setupSocialSettings(page, { name: '홍길동', nameSaved: true })

    await expect(page.getByPlaceholder('실명을 입력해주세요')).not.toBeVisible()
    await expect(page.getByText('홍길동')).toBeVisible()
  })

  test('생년월일 저장 이력이 있으면 페이지 진입 시 생년월일 입력 필드가 없다', async ({ page }) => {
    await setupSocialSettings(page, { birthDay: '1990-01-05', birthDaySaved: true })

    await expect(page.getByLabel('출생 연도')).not.toBeVisible()
  })

  test('이름·생년월일 모두 저장 이력이 있으면 저장 버튼이 0개다', async ({ page }) => {
    await setupSocialSettings(page, {
      name: '홍길동',
      birthDay: '1990-01-05',
      nameSaved: true,
      birthDaySaved: true,
    })

    await expect(page.getByRole('button', { name: '저장', exact: true })).toHaveCount(0)
    await expect(page.getByPlaceholder('실명을 입력해주세요')).not.toBeVisible()
    await expect(page.getByLabel('출생 연도')).not.toBeVisible()
  })

  test('이름 저장 후 /settings 재진입 시에도 잠금이 유지된다', async ({ page }) => {
    await setupSocialSettings(page)

    // 이름 저장
    await page.getByPlaceholder('실명을 입력해주세요').fill('홍길동')
    await page.getByRole('button', { name: '저장', exact: true }).first().click()
    await page.getByRole('dialog').getByRole('button', { name: '확인' }).click()
    await expect(page.getByPlaceholder('실명을 입력해주세요')).not.toBeVisible({ timeout: 5_000 })

    // 홈으로 이동 후 /settings 재진입
    await page.goto('/')
    await page.goto('/settings')
    await expect(page.getByRole('button', { name: '변경사항 저장' })).toBeVisible({ timeout: 15_000 })

    // 잠금 유지 확인
    await expect(page.getByPlaceholder('실명을 입력해주세요')).not.toBeVisible()
  })
})

// ─────────────────────────────────────────────
// 9. 계정 삭제 — 소셜 사용자 (비밀번호 없이)
// ─────────────────────────────────────────────
test.describe('소셜 로그인 — 계정 삭제', () => {
  async function openDeleteModal(page: Page) {
    await setupSocialSettings(page)
    await page.getByRole('button', { name: '계정 삭제' }).click()
    await expect(page.getByPlaceholder('삭제하겠습니다')).toBeVisible()
  }

  function clickAgreeCheckbox(page: Page) {
    return page
      .getByRole('dialog')
      .locator('label')
      .filter({ hasText: '계정 삭제에 동의합니다.' })
      .click()
  }

  test('삭제 모달에 비밀번호 입력 필드가 없다', async ({ page }) => {
    await openDeleteModal(page)
    await expect(page.getByPlaceholder('비밀번호를 입력해 주세요')).not.toBeVisible()
  })

  test('체크박스·문구 모두 미입력 시 확인 버튼이 비활성화된다', async ({ page }) => {
    await openDeleteModal(page)
    await expect(page.getByRole('dialog').getByRole('button', { name: '확인' })).toBeDisabled()
  })

  test('체크박스만 동의하고 문구 미입력 시 확인 버튼이 비활성화된다', async ({ page }) => {
    await openDeleteModal(page)
    await clickAgreeCheckbox(page)
    await expect(page.getByRole('dialog').getByRole('button', { name: '확인' })).toBeDisabled()
  })

  test('문구만 입력하고 체크박스 미동의 시 확인 버튼이 비활성화된다', async ({ page }) => {
    await openDeleteModal(page)
    await page.getByPlaceholder('삭제하겠습니다').fill('삭제하겠습니다')
    await expect(page.getByRole('dialog').getByRole('button', { name: '확인' })).toBeDisabled()
  })

  test('잘못된 문구 입력 시 확인 버튼이 비활성화된다', async ({ page }) => {
    await openDeleteModal(page)
    await clickAgreeCheckbox(page)
    await page.getByPlaceholder('삭제하겠습니다').fill('삭제할게요')
    await expect(page.getByRole('dialog').getByRole('button', { name: '확인' })).toBeDisabled()
  })

  test('체크박스 동의 + 올바른 문구 입력만으로 확인 버튼이 활성화된다', async ({ page }) => {
    await openDeleteModal(page)
    await clickAgreeCheckbox(page)
    await page.getByPlaceholder('삭제하겠습니다').fill('삭제하겠습니다')
    await expect(page.getByRole('dialog').getByRole('button', { name: '확인' })).toBeEnabled()
  })

  test('삭제 성공 시 /login으로 이동한다', async ({ page }) => {
    await openDeleteModal(page)
    await clickAgreeCheckbox(page)
    await page.getByPlaceholder('삭제하겠습니다').fill('삭제하겠습니다')
    await page.getByRole('dialog').getByRole('button', { name: '확인' }).click()

    await page.waitForURL('/login', { timeout: 8_000 })
  })

  test('삭제 실패 시 에러 토스트가 표시되고 모달이 유지된다', async ({ page }) => {
    await openDeleteModal(page)

    await page.evaluate(() => {
      const orig = window.fetch.bind(window)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
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

    await clickAgreeCheckbox(page)
    await page.getByPlaceholder('삭제하겠습니다').fill('삭제하겠습니다')
    await page.getByRole('dialog').getByRole('button', { name: '확인' }).click()

    await expect(toastLocator(page)).toBeVisible({ timeout: 5_000 })
    await expect(page.getByPlaceholder('삭제하겠습니다')).toBeVisible()
  })

  test('모달 닫기 후 재오픈 시 입력 상태가 초기화된다', async ({ page }) => {
    await openDeleteModal(page)
    await clickAgreeCheckbox(page)
    await page.getByPlaceholder('삭제하겠습니다').fill('삭제하겠습니다')

    await page.getByRole('dialog').getByRole('button', { name: '취소' }).click()
    await page.getByRole('button', { name: '계정 삭제' }).click()

    await expect(page.getByRole('checkbox')).not.toBeChecked()
    await expect(page.getByPlaceholder('삭제하겠습니다')).toHaveValue('')
  })
})
