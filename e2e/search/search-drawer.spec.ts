/**
 * 유저 검색 드로어 E2E 테스트
 *
 * @interface-contract
 *   API:
 *     - POST v1/users/token/refresh        (bootstrapAuthedPage stub → 200)
 *     - GET  v1/users?search={nickname}    (page.route stub)
 *     - GET  v1/users/:userId/profile      (page.route stub — 프로필 이동 검증용)
 *
 * Mock 데이터 (MOCK_USERS):
 *   - "kim" 검색    → traveler_kim, kim_jr (2개)
 *   - "traveler" 검색 → traveler_kim (1개)
 *   - "explorer" 검색 → yh_explorer, sea_explorer (2개)
 *   - "xyz999" 검색  → [] (0개)
 *
 * 검증 항목:
 *   1. 드로어 열기·닫기 (열림, X버튼 닫힘, 재오픈 시 검색어 초기화)
 *   2. 초기 상태 (힌트 텍스트, 자동 포커스)
 *   3. 검색 성공 (결과 표시, 부분 일치, API 파라미터, Authorization 헤더, 지우기 버튼)
 *   4. 검색 실패 (빈 결과, API 500, API 401)
 *   5. 결과 클릭 (프로필 페이지 이동, 드로어 닫힘, 검색어 초기화)
 *   6. 로딩 상태 (스켈레톤 표시, 디바운스 후 API 호출)
 *
 * MSW usersHandlers는 index.ts에서 비활성화 상태이므로
 * 유저 검색 요청은 page.route()로 직접 stub 처리한다.
 */

import { test, expect, type Page } from '@playwright/test'

// ─── Mock 데이터 ────────────────────────────────────────────────────────────────

const MOCK_USERS = [
  { user_id: 'user-1', nickname: 'traveler_kim', profile_img: null },
  { user_id: 'user-2', nickname: 'kim_jr', profile_img: null },
  { user_id: 'user-3', nickname: 'yh_explorer', profile_img: null },
  { user_id: 'user-4', nickname: 'sea_explorer', profile_img: null },
]

const MOCK_USER_PROFILE = {
  name: '여행자',
  nickname: 'traveler_kim',
  profile_img: null,
  intro: '',
  follower: 0,
  following: 0,
  is_following: false,
  posts_count: 0,
  posts: [],
}

// ─── 헬퍼 ─────────────────────────────────────────────────────────────────────

/**
 * page.goto 전에 호출.
 * token/refresh → 200 stub, users/me → 401 stub.
 */
async function bootstrapAuthedPage(page: Page) {
  await page.addInitScript({
    content: `
      (() => {
        const orig = window.fetch.bind(window);
        window.fetch = async (input, init) => {
          const url = input instanceof Request ? input.url : String(input);
          const method = input instanceof Request ? input.method : (init?.method ?? 'GET');
          if (url.includes('/users/token/refresh') && method === 'POST') {
            return new Response(
              JSON.stringify({ access_token: 'mock_access_token' }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }
          if (url.includes('/users/me') && method === 'GET') {
            return new Response(
              JSON.stringify({ error_detail: 'not implemented in test' }),
              { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
          }
          return orig(input, init);
        };
      })();
    `,
  })
}

/**
 * GET v1/users?search=... 를 stub.
 * override 반환값이 있으면 그 응답으로 처리, 없으면 MOCK_USERS를 nickname 부분 일치로 필터링.
 * 캡처된 요청 URL 목록도 반환한다.
 */
async function setupUserSearchRoute(
  page: Page,
  override?: (search: string) => { status: number; body: object } | null,
): Promise<{ captured: { url: string; authHeader: string | null }[] }> {
  const captured: { url: string; authHeader: string | null }[] = []

  await page.route(
    (url) => {
      try {
        const u = new URL(url)
        return u.pathname.endsWith('/users')
      } catch {
        return false
      }
    },
    async (route) => {
      if (route.request().method() !== 'GET') return route.continue()

      const reqUrl = route.request().url()
      const authHeader = route.request().headers()['authorization'] ?? null
      captured.push({ url: reqUrl, authHeader })

      const search = new URL(reqUrl).searchParams.get('search')?.toLowerCase() ?? ''

      if (override) {
        const result = override(search)
        if (result) {
          await route.fulfill({
            status: result.status,
            contentType: 'application/json',
            body: JSON.stringify(result.body),
          })
          return
        }
      }

      const filtered = MOCK_USERS.filter((u) =>
        u.nickname.toLowerCase().includes(search),
      )
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ results: filtered }),
      })
    },
  )

  return { captured }
}

/** GET v1/users/:userId/profile 을 stub. */
async function setupUserProfileRoute(page: Page) {
  await page.route(
    (url) => {
      try {
        const u = new URL(url)
        return u.pathname.includes('/users/') && u.pathname.includes('/profile')
      } catch {
        return false
      }
    },
    async (route) => {
      if (route.request().method() !== 'GET') return route.continue()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_USER_PROFILE),
      })
    },
  )
}

/** 탐색 페이지 초기 로드 완료까지 대기 (exploreHandlers 활성화 상태) */
async function gotoExplorePage(page: Page) {
  await page.goto('/explore')
  await expect(
    page.locator('[data-testid="explore-post-card"]').first(),
  ).toBeVisible({ timeout: 15000 })
}

/** SideNav 검색 버튼 클릭 → 드로어 열림 대기 */
async function openSearchDrawer(page: Page) {
  await page.getByRole('button', { name: '검색' }).click()
  await expect(page.locator('[data-testid="side-drawer"]')).toBeVisible({
    timeout: 5000,
  })
}

/** 검색어 입력 */
async function fillSearch(page: Page, query: string) {
  await page.getByPlaceholder('닉네임으로 검색...').fill(query)
}

/** 검색 결과가 count개 표시될 때까지 대기 */
async function waitForResults(page: Page, count: number) {
  await expect(page.locator('[data-testid="user-search-result"]')).toHaveCount(
    count,
    { timeout: 5000 },
  )
}

// ─── 1. 드로어 열기·닫기 ────────────────────────────────────────────────────────

test.describe('유저 검색 드로어 — 열기·닫기', () => {
  test('SideNav 검색 버튼 클릭 시 드로어가 열린다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await setupUserSearchRoute(page)
    await gotoExplorePage(page)

    await page.getByRole('button', { name: '검색' }).click()

    await expect(page.locator('[data-testid="side-drawer"]')).toBeVisible({
      timeout: 5000,
    })
  })

  test('닫기(✕) 버튼 클릭 시 드로어가 닫힌다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await setupUserSearchRoute(page)
    await gotoExplorePage(page)
    await openSearchDrawer(page)

    await page.getByRole('button', { name: '닫기' }).click()

    // AnimatePresence exit 애니메이션 완료 후 DOM에서 제거됨
    await expect(page.locator('[data-testid="side-drawer"]')).toHaveCount(0, {
      timeout: 2000,
    })
  })

  test('닫기 후 재오픈 시 검색어가 초기화된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await setupUserSearchRoute(page)
    await gotoExplorePage(page)
    await openSearchDrawer(page)

    // 검색 후 닫기
    await fillSearch(page, 'kim')
    await waitForResults(page, 2)
    await page.getByRole('button', { name: '닫기' }).click()
    await expect(page.locator('[data-testid="side-drawer"]')).toHaveCount(0)

    // 재오픈
    await openSearchDrawer(page)

    await expect(page.getByPlaceholder('닉네임으로 검색...')).toHaveValue('')
    await expect(
      page.getByText('닉네임을 입력해 유저를 검색하세요'),
    ).toBeVisible()
  })
})

// ─── 2. 초기 상태 ──────────────────────────────────────────────────────────────

test.describe('유저 검색 드로어 — 초기 상태', () => {
  test('드로어 열리면 검색 인풋이 비어있고 힌트 텍스트가 표시된다', async ({
    page,
  }) => {
    await bootstrapAuthedPage(page)
    await setupUserSearchRoute(page)
    await gotoExplorePage(page)
    await openSearchDrawer(page)

    await expect(page.getByPlaceholder('닉네임으로 검색...')).toHaveValue('')
    await expect(
      page.getByText('닉네임을 입력해 유저를 검색하세요'),
    ).toBeVisible()
  })

  test('드로어가 열리면 검색 인풋에 자동 포커스된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await setupUserSearchRoute(page)
    await gotoExplorePage(page)
    await openSearchDrawer(page)

    await expect(page.getByPlaceholder('닉네임으로 검색...')).toBeFocused()
  })

  test('힌트 텍스트 표시 중에는 결과 목록이 없다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await setupUserSearchRoute(page)
    await gotoExplorePage(page)
    await openSearchDrawer(page)

    await expect(
      page.locator('[data-testid="user-search-result"]'),
    ).toHaveCount(0)
  })
})

// ─── 3. 검색 성공 ──────────────────────────────────────────────────────────────

test.describe('유저 검색 드로어 — 검색 성공', () => {
  test('"kim" 검색 시 부분 일치하는 2개 결과가 표시된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await setupUserSearchRoute(page)
    await gotoExplorePage(page)
    await openSearchDrawer(page)

    await fillSearch(page, 'kim')

    await waitForResults(page, 2)
  })

  test('"traveler" 검색 시 traveler_kim 1개만 표시된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await setupUserSearchRoute(page)
    await gotoExplorePage(page)
    await openSearchDrawer(page)

    await fillSearch(page, 'traveler')

    await waitForResults(page, 1)
    await expect(page.getByText('traveler_kim')).toBeVisible()
  })

  test('결과 목록에 닉네임이 표시된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await setupUserSearchRoute(page)
    await gotoExplorePage(page)
    await openSearchDrawer(page)

    await fillSearch(page, 'explorer')
    await waitForResults(page, 2)

    await expect(page.getByText('yh_explorer')).toBeVisible()
    await expect(page.getByText('sea_explorer')).toBeVisible()
  })

  test('검색어 지우기 버튼 클릭 시 인풋이 초기화되고 힌트 텍스트가 복귀한다', async ({
    page,
  }) => {
    await bootstrapAuthedPage(page)
    await setupUserSearchRoute(page)
    await gotoExplorePage(page)
    await openSearchDrawer(page)

    await fillSearch(page, 'kim')
    await waitForResults(page, 2)

    await page.getByRole('button', { name: '검색어 지우기' }).click()

    await expect(page.getByPlaceholder('닉네임으로 검색...')).toHaveValue('')
    await expect(
      page.getByText('닉네임을 입력해 유저를 검색하세요'),
    ).toBeVisible()
    await expect(
      page.locator('[data-testid="user-search-result"]'),
    ).toHaveCount(0)
  })

  test('API 요청 URL에 search 쿼리 파라미터가 포함된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    const { captured } = await setupUserSearchRoute(page)
    await gotoExplorePage(page)
    await openSearchDrawer(page)

    await fillSearch(page, 'kim')
    await waitForResults(page, 2)

    const searchReq = captured.find((c) => c.url.includes('search=kim'))
    expect(searchReq).toBeDefined()
  })

  test('API 요청에 Authorization 헤더가 포함된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    const { captured } = await setupUserSearchRoute(page)
    await gotoExplorePage(page)
    await openSearchDrawer(page)

    await fillSearch(page, 'traveler')
    await waitForResults(page, 1)

    // bootstrapAuthedPage가 주입한 mock_access_token이 헤더에 포함됨
    const req = captured.find((c) => c.url.includes('search='))
    expect(req?.authHeader).toBe('Bearer mock_access_token')
  })
})

// ─── 4. 검색 실패 ──────────────────────────────────────────────────────────────

test.describe('유저 검색 드로어 — 검색 실패', () => {
  test('결과 없는 검색어 입력 시 "검색 결과가 없어요" 빈 상태가 표시된다', async ({
    page,
  }) => {
    await bootstrapAuthedPage(page)
    await setupUserSearchRoute(page)
    await gotoExplorePage(page)
    await openSearchDrawer(page)

    await fillSearch(page, 'xyz999존재하지않는닉네임')

    await expect(page.getByText('검색 결과가 없어요')).toBeVisible({
      timeout: 5000,
    })
    await expect(
      page.locator('[data-testid="user-search-result"]'),
    ).toHaveCount(0)
  })

  test('API 500 에러 시 "검색 중 오류가 발생했습니다" 에러 메시지가 표시된다', async ({
    page,
  }) => {
    await bootstrapAuthedPage(page)
    await setupUserSearchRoute(page, () => ({
      status: 500,
      body: { error_detail: '서버 오류' },
    }))
    await gotoExplorePage(page)
    await openSearchDrawer(page)

    await fillSearch(page, 'kim')

    await expect(page.getByText('검색 중 오류가 발생했습니다')).toBeVisible({
      timeout: 5000,
    })
    await expect(
      page.locator('[data-testid="user-search-result"]'),
    ).toHaveCount(0)
  })

  test('API 401 에러 시 "검색 중 오류가 발생했습니다" 에러 메시지가 표시된다', async ({
    page,
  }) => {
    await bootstrapAuthedPage(page)
    await setupUserSearchRoute(page, () => ({
      status: 401,
      body: { error_detail: '인증되지 않은 사용자입니다.' },
    }))
    await gotoExplorePage(page)
    await openSearchDrawer(page)

    await fillSearch(page, 'kim')

    await expect(page.getByText('검색 중 오류가 발생했습니다')).toBeVisible({
      timeout: 5000,
    })
  })

  test('에러 발생 후 다시 다른 검색어를 입력하면 새 요청이 전송된다', async ({
    page,
  }) => {
    await bootstrapAuthedPage(page)

    let callCount = 0
    await setupUserSearchRoute(page, (search) => {
      callCount++
      // 첫 번째 요청만 500, 이후는 정상
      if (search === 'fail') return { status: 500, body: { error_detail: '서버 오류' } }
      return null
    })

    await gotoExplorePage(page)
    await openSearchDrawer(page)

    await fillSearch(page, 'fail')
    await expect(page.getByText('검색 중 오류가 발생했습니다')).toBeVisible({
      timeout: 5000,
    })

    const countAfterFail = callCount

    await fillSearch(page, 'kim')
    await waitForResults(page, 2)

    expect(callCount).toBeGreaterThan(countAfterFail)
  })
})

// ─── 5. 결과 클릭 ──────────────────────────────────────────────────────────────

test.describe('유저 검색 드로어 — 결과 클릭', () => {
  test('결과 아이템 클릭 시 해당 유저 프로필 페이지로 이동한다', async ({
    page,
  }) => {
    await bootstrapAuthedPage(page)
    await setupUserSearchRoute(page)
    await setupUserProfileRoute(page)
    await gotoExplorePage(page)
    await openSearchDrawer(page)

    await fillSearch(page, 'traveler')
    await waitForResults(page, 1)

    await page.locator('[data-testid="user-search-result"]').first().click()

    await expect(page).toHaveURL(/\/users\/user-1/, { timeout: 5000 })
  })

  test('결과 클릭 후 드로어가 닫힌다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await setupUserSearchRoute(page)
    await setupUserProfileRoute(page)
    await gotoExplorePage(page)
    await openSearchDrawer(page)

    await fillSearch(page, 'traveler')
    await waitForResults(page, 1)

    await page.locator('[data-testid="user-search-result"]').first().click()

    await expect(page.locator('[data-testid="side-drawer"]')).toHaveCount(0, {
      timeout: 2000,
    })
  })

  test('결과 클릭 후 뒤로가기하고 드로어를 다시 열면 검색어가 초기화된다', async ({
    page,
  }) => {
    await bootstrapAuthedPage(page)
    await setupUserSearchRoute(page)
    await setupUserProfileRoute(page)
    await gotoExplorePage(page)
    await openSearchDrawer(page)

    await fillSearch(page, 'traveler')
    await waitForResults(page, 1)
    await page.locator('[data-testid="user-search-result"]').first().click()
    await expect(page).toHaveURL(/\/users\/user-1/, { timeout: 5000 })

    await page.goBack()
    await expect(
      page.locator('[data-testid="explore-post-card"]').first(),
    ).toBeVisible({ timeout: 10000 })

    await openSearchDrawer(page)

    await expect(page.getByPlaceholder('닉네임으로 검색...')).toHaveValue('')
    await expect(
      page.getByText('닉네임을 입력해 유저를 검색하세요'),
    ).toBeVisible()
  })
})

// ─── 6. 로딩 상태 ──────────────────────────────────────────────────────────────

test.describe('유저 검색 드로어 — 로딩 상태', () => {
  test('검색 중 로딩 스켈레톤이 표시된다', async ({ page }) => {
    await bootstrapAuthedPage(page)

    // 검색 응답을 700ms 지연
    await page.route(
      (url) => {
        try {
          return new URL(url).pathname.endsWith('/users')
        } catch {
          return false
        }
      },
      async (route) => {
        if (route.request().method() !== 'GET') return route.continue()
        await new Promise<void>((resolve) => setTimeout(resolve, 700))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ results: MOCK_USERS }),
        })
      },
    )

    await gotoExplorePage(page)
    await openSearchDrawer(page)
    await fillSearch(page, 'kim')

    // debounce 300ms 이후 요청 전송 → 응답 전 스켈레톤 표시
    await expect(page.locator('[data-testid="search-loading"]')).toBeVisible({
      timeout: 2000,
    })

    // 응답 완료 후 스켈레톤 사라짐
    await expect(page.locator('[data-testid="search-loading"]')).toHaveCount(0, {
      timeout: 3000,
    })
    await expect(
      page.locator('[data-testid="user-search-result"]'),
    ).toHaveCount(4, { timeout: 2000 })
  })

  test('debounce 300ms 이전에는 API 요청이 전송되지 않는다', async ({
    page,
  }) => {
    await bootstrapAuthedPage(page)
    const { captured } = await setupUserSearchRoute(page)
    await gotoExplorePage(page)
    await openSearchDrawer(page)

    // 한 글자씩 빠르게 입력 (debounce 초기화 반복)
    const input = page.getByPlaceholder('닉네임으로 검색...')
    await input.pressSequentially('kim', { delay: 50 })

    // 입력 직후 — 아직 300ms가 지나지 않아 API 미호출
    expect(captured.length).toBe(0)

    // debounce 완료 후 API 호출됨
    await waitForResults(page, 2)
    expect(captured.length).toBeGreaterThan(0)
  })
})
