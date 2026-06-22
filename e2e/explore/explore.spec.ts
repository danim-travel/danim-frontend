/**
 * 탐색 페이지(`/explore`) E2E 테스트
 *
 * @interface-contract
 *   API:
 *     - POST   v1/users/token/refresh           (silent refresh, stub로 주입)
 *     - GET    v1/posts/explore?...             (MSW exploreHandlers)
 *     - GET    v1/posts/:postId                 (routeOverride — postsHandlers 비활성화 상태)
 *     - GET    v1/comments?post_id=...          (routeOverride — commentsHandlers 비활성화 상태)
 *
 * 검증 항목:
 *   1. 초기 렌더링 (12개, 스켈레톤, 검색바/카테고리 버튼)
 *   2. 검색 성공 — debounce 필터링, URL 반영, 검색 초기화
 *   3. 검색 실패 — 빈 상태, API 500 에러 토스트
 *   4. 카테고리 성공 — active 스타일, 지역 필터링, 전체 복원, 검색+카테고리 복합
 *   5. 카테고리 실패 — 결과 없는 카테고리 → 빈 상태
 *   6. 게시글 클릭 성공 — PostModal 열림, postId API 요청, 닫기 버튼, backdrop 닫기
 *   7. 게시글 클릭 실패 — API 에러 → 모달 내 에러 메시지
 *   8. 무한 스크롤 — 다음 페이지 로드
 *
 * Mock 데이터 기준 (MSW exploreHandlers / MOCK_TITLES 25개):
 *   - 전체 25개, page_size = 12 → 첫 페이지 12개
 *   - '부산' 검색: '부산 해운대 야경 투어', '부산 감천문화마을 산책' → 2개
 *   - '제주' 카테고리: '제주도 동쪽 드라이브 코스', '제주 서쪽 올레길' → 2개
 *   - '제주' 카테고리 + '서쪽' 검색: '제주 서쪽 올레길' → 1개
 *   - '충청' 카테고리: 0개 (빈 상태)
 *
 * MSW postsHandlers / commentsHandlers는 비활성화 상태.
 * 게시글 상세/댓글은 routeOverride로 stub 처리.
 */

import { test, expect, type Page } from '@playwright/test'

// ─── 상수 ─────────────────────────────────────────────────────────────────────

/** exploreHandlers가 반환하는 첫 번째 게시글의 post_id (ALL_FEED_ITEMS[0]) */
const FIRST_POST_ID = 'mock_01JWPK3N8XQVHM4F2R9BDYC_001'

/** GET posts/:postId 응답 stub — PostDetail 최소 구조 */
const POST_DETAIL_STUB = JSON.stringify({
  post: {
    post_id: FIRST_POST_ID,
    title: '탐색 테스트 게시글',
    description: '탐색 페이지 테스트용 게시글입니다.',
    thumbnail: 'https://picsum.photos/seed/test/480/320',
    created_at: '2024-01-01T00:00:00Z',
  },
  user: {
    user_id: 'user-1',
    nickname: '여행자',
    profile_img: 'https://picsum.photos/seed/user1/100/100',
  },
  spots: [],
  like_count: 5,
  is_liked: false,
  comment_count: 0,
  is_bookmarked: false,
  is_owner: false,
})

type CapturedRequest = { url: string; method: string; body: string | null }

// ─── 헬퍼 ─────────────────────────────────────────────────────────────────────

/**
 * page.goto 전에 호출.
 * - token/refresh → 200 stub (인증 hydration 성공)
 * - users/me → 401 (authHandlers 비활성화)
 * - routeOverrides 콜백으로 추가 API를 가로챌 수 있다.
 * - 모든 fetch 요청을 window.__fetchCaptures에 기록한다.
 */
async function bootstrapAuthedPage(
  page: Page,
  routeOverrides?: (input: RequestInfo | URL, method: string, url: string) => Response | null | undefined,
) {
  await page.addInitScript({
    content: `
      (() => {
        const orig = window.fetch.bind(window);
        window.__fetchCaptures = [];
        const overrideFn = ${routeOverrides ? routeOverrides.toString() : 'null'};
        window.fetch = async (input, init) => {
          const url = input instanceof Request ? input.url : String(input);
          const method = input instanceof Request ? input.method : (init?.method ?? 'GET');

          let body = null;
          try {
            if (input instanceof Request && input.body !== null) {
              body = await input.clone().text();
            } else if (typeof init?.body === 'string') {
              body = init.body;
            }
          } catch {}
          window.__fetchCaptures.push({ url, method, body });

          if (overrideFn) {
            const overridden = overrideFn(input, method, url);
            if (overridden) return overridden;
          }

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

async function getCaptures(page: Page): Promise<CapturedRequest[]> {
  return page.evaluate(
    () => (window as Window & { __fetchCaptures?: CapturedRequest[] }).__fetchCaptures ?? [],
  )
}

/** 첫 번째 게시글 카드가 표시될 때까지 대기 */
async function waitForExploreLoaded(page: Page) {
  await expect(page.locator('[data-testid="explore-post-card"]').first()).toBeVisible({ timeout: 15000 })
}

/** PageContainer(overflow-y-auto)를 끝까지 스크롤 */
async function scrollExploreToBottom(page: Page) {
  await page.evaluate(() => {
    const grid = document.querySelector('[data-testid="explore-grid"]')
    const container = grid?.closest('div.overflow-y-auto') as HTMLElement | null
    container?.scrollTo({ top: container.scrollHeight, behavior: 'instant' })
  })
}

/**
 * page.route로 posts/:postId 및 comments 요청을 stub한다.
 * POST_DETAIL_STUB은 Node.js 컨텍스트 변수이므로 addInitScript 클로저 직렬화 대신
 * Playwright 쪽에서 처리해야 한다.
 */
async function setupPostDetailRoutes(page: Page) {
  await page.route(/\/posts\/mock_[a-zA-Z0-9_]+$/, async (route) => {
    if (route.request().method() !== 'GET') return route.continue()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: POST_DETAIL_STUB,
    })
  })
  await page.route(/\/comments(\?|$)/, async (route) => {
    if (route.request().method() !== 'GET') return route.continue()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ next: null, results: [] }),
    })
  })
}

// ─── 1. 초기 렌더링 ────────────────────────────────────────────────────────────

test.describe('탐색 페이지 — 초기 렌더링', () => {
  test('첫 페이지(12개) 게시글 카드가 렌더링된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/explore')
    await waitForExploreLoaded(page)

    await expect(page.locator('[data-testid="explore-post-card"]')).toHaveCount(12)
  })

  test('검색바와 카테고리 버튼 8개가 표시된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/explore')
    await waitForExploreLoaded(page)

    await expect(page.getByPlaceholder('여행지, 장소 검색...')).toBeVisible()

    const categories = ['전체', '경기', '강원', '충청', '전라', '경상', '제주', '서울']
    for (const cat of categories) {
      await expect(page.locator(`[data-testid="category-btn-${cat}"]`)).toBeVisible()
    }
  })

  test('기본 선택은 "전체"이며 active 스타일이 적용된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/explore')
    await waitForExploreLoaded(page)

    const allBtn = page.locator('[data-testid="category-btn-전체"]')
    // chip-bg-selected 토큰이 적용된 버튼은 bg-(--chip-bg-selected) 클래스를 가진다
    await expect(allBtn).toHaveClass(/chip-bg-selected/)
  })

  test('API 지연 중 스켈레톤이 표시된다', async ({ page }) => {
    await bootstrapAuthedPage(page, (_input, method, url) => {
      if (/\/posts\/explore(\?|$)/.test(url) && method === 'GET') {
        return new Response(
          new ReadableStream({
            start(controller) {
              setTimeout(() => {
                controller.enqueue(
                  new TextEncoder().encode(
                    JSON.stringify({ next: null, results: [] }),
                  ),
                )
                controller.close()
              }, 1000)
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return null
    })

    await page.goto('/explore')
    await expect(page.locator('[data-testid="explore-skeleton"]')).toBeVisible({ timeout: 5000 })
  })
})

// ─── 2. 검색 — 성공 ────────────────────────────────────────────────────────────

test.describe('탐색 페이지 — 검색 성공', () => {
  test('"부산" 검색 후 필터링된 2개의 게시글만 표시된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/explore')
    await waitForExploreLoaded(page)

    await page.getByPlaceholder('여행지, 장소 검색...').fill('부산')

    // debounce 300ms + 네트워크 응답 대기
    await expect(page.locator('[data-testid="explore-post-card"]')).toHaveCount(2, { timeout: 5000 })
  })

  test('검색어가 URL search 파라미터에 반영된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/explore')
    await waitForExploreLoaded(page)

    await page.getByPlaceholder('여행지, 장소 검색...').fill('부산')

    // nuqs가 URL을 업데이트할 때까지 대기 (debounce 300ms 이후)
    await expect(page).toHaveURL(/search=/, { timeout: 3000 })
  })

  test('검색 초기화 버튼 클릭 시 전체 12개 게시글이 다시 표시된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/explore')
    await waitForExploreLoaded(page)

    await page.getByPlaceholder('여행지, 장소 검색...').fill('부산')
    await expect(page.locator('[data-testid="explore-post-card"]')).toHaveCount(2, { timeout: 5000 })

    await page.getByRole('button', { name: '검색어 지우기' }).click()

    // 즉시 search=null → 전체 목록 복원
    await expect(page.locator('[data-testid="explore-post-card"]')).toHaveCount(12, { timeout: 5000 })
  })

  test('검색 초기화 후 URL에 search 파라미터가 사라진다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/explore')
    await waitForExploreLoaded(page)

    await page.getByPlaceholder('여행지, 장소 검색...').fill('부산')
    await expect(page).toHaveURL(/search=/, { timeout: 3000 })

    await page.getByRole('button', { name: '검색어 지우기' }).click()
    await expect(page).not.toHaveURL(/search=/, { timeout: 3000 })
  })

  test('API 요청 URL에 search 쿼리 파라미터가 포함된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/explore')
    await waitForExploreLoaded(page)

    await page.getByPlaceholder('여행지, 장소 검색...').fill('부산')
    await expect(page.locator('[data-testid="explore-post-card"]')).toHaveCount(2, { timeout: 5000 })

    const captures = await getCaptures(page)
    const searchReq = captures.find(
      (c) => /\/posts\/explore/.test(c.url) && c.url.includes('search=') && c.method === 'GET',
    )
    expect(searchReq).toBeDefined()
  })
})

// ─── 3. 검색 — 실패 ────────────────────────────────────────────────────────────

test.describe('탐색 페이지 — 검색 실패', () => {
  test('결과 없는 검색어 입력 시 빈 상태 메시지가 표시된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/explore')
    await waitForExploreLoaded(page)

    await page.getByPlaceholder('여행지, 장소 검색...').fill('xyz999존재하지않는검색어')

    await expect(page.locator('[data-testid="explore-post-card"]')).toHaveCount(0, { timeout: 5000 })
    await expect(page.getByText('게시글이 없어요')).toBeVisible()
  })

  test('API 500 에러 시 에러 토스트가 표시된다', async ({ page }) => {
    await bootstrapAuthedPage(page, (_input, method, url) => {
      if (/\/posts\/explore(\?|$)/.test(url) && method === 'GET') {
        return new Response(
          JSON.stringify({ error_detail: '서버 오류' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return null
    })

    await page.goto('/explore')

    // getApiErrorMessage: 500 → "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
    await expect(page.getByText('서버 오류가 발생했습니다.')).toBeVisible({ timeout: 10000 })
  })

  test('API 401 에러 시 백엔드 메시지가 토스트로 표시된다', async ({ page }) => {
    // token/refresh는 성공 → accessToken 확보
    // 그러나 posts/explore는 401로 응답 (인증되지 않은 사용자 시뮬레이션)
    await bootstrapAuthedPage(page, (_input, method, url) => {
      if (/\/posts\/explore(\?|$)/.test(url) && method === 'GET') {
        return new Response(
          JSON.stringify({ error_detail: '인증되지 않은 사용자입니다.' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return null
    })

    await page.goto('/explore')

    // getApiErrorMessage: 401 → detail 문자열 반환 → "인증되지 않은 사용자입니다."
    await expect(page.getByText('인증되지 않은 사용자입니다.')).toBeVisible({ timeout: 10000 })
  })
})

// ─── 4. 카테고리 — 성공 ────────────────────────────────────────────────────────

test.describe('탐색 페이지 — 카테고리 성공', () => {
  test('"제주" 클릭 시 active 스타일이 적용되고 "전체"는 해제된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/explore')
    await waitForExploreLoaded(page)

    await page.locator('[data-testid="category-btn-제주"]').click()

    await expect(page.locator('[data-testid="category-btn-제주"]')).toHaveClass(/chip-bg-selected/)
    await expect(page.locator('[data-testid="category-btn-전체"]')).not.toHaveClass(/chip-bg-selected/)
  })

  test('"제주" 카테고리 클릭 시 해당 지역 게시글 2개만 표시된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/explore')
    await waitForExploreLoaded(page)

    await page.locator('[data-testid="category-btn-제주"]').click()

    // '제주도 동쪽 드라이브 코스', '제주 서쪽 올레길' → 2개
    await expect(page.locator('[data-testid="explore-post-card"]')).toHaveCount(2, { timeout: 5000 })
  })

  test('"전체" 클릭 시 전체 12개 목록이 복원된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/explore')
    await waitForExploreLoaded(page)

    await page.locator('[data-testid="category-btn-제주"]').click()
    await expect(page.locator('[data-testid="explore-post-card"]')).toHaveCount(2, { timeout: 5000 })

    await page.locator('[data-testid="category-btn-전체"]').click()
    await expect(page.locator('[data-testid="explore-post-card"]')).toHaveCount(12, { timeout: 5000 })
  })

  test('"제주" 카테고리 + "서쪽" 검색 복합 필터링 시 1개만 표시된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/explore')
    await waitForExploreLoaded(page)

    await page.locator('[data-testid="category-btn-제주"]').click()
    await expect(page.locator('[data-testid="explore-post-card"]')).toHaveCount(2, { timeout: 5000 })

    await page.getByPlaceholder('여행지, 장소 검색...').fill('서쪽')

    // '제주 서쪽 올레길' 만 매칭 → 1개
    await expect(page.locator('[data-testid="explore-post-card"]')).toHaveCount(1, { timeout: 5000 })
  })

  test('카테고리 선택 시 API 요청 URL에 category 파라미터가 포함된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/explore')
    await waitForExploreLoaded(page)

    await page.locator('[data-testid="category-btn-경상"]').click()
    await expect(page.locator('[data-testid="explore-post-card"]')).toBeVisible({ timeout: 5000 })

    const captures = await getCaptures(page)
    const categoryReq = captures.find(
      (c) => /\/posts\/explore/.test(c.url) && c.url.includes('category=') && c.method === 'GET',
    )
    expect(categoryReq).toBeDefined()
    expect(decodeURIComponent(categoryReq!.url)).toContain('category=경상')
  })
})

// ─── 5. 카테고리 — 실패 ────────────────────────────────────────────────────────

test.describe('탐색 페이지 — 카테고리 실패', () => {
  test('"충청" 카테고리 선택 시 빈 상태 메시지가 표시된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/explore')
    await waitForExploreLoaded(page)

    // 충청 키워드('충청', '천안', '공주')는 MOCK_TITLES에 없음 → 0개
    await page.locator('[data-testid="category-btn-충청"]').click()

    await expect(page.locator('[data-testid="explore-post-card"]')).toHaveCount(0, { timeout: 5000 })
    await expect(page.getByText('게시글이 없어요')).toBeVisible()
  })
})

// ─── 6. 게시글 클릭 — 성공 ─────────────────────────────────────────────────────

test.describe('탐색 페이지 — 게시글 클릭 성공', () => {
  test('게시글 카드 클릭 시 PostModal이 열린다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await setupPostDetailRoutes(page)
    await page.goto('/explore')
    await waitForExploreLoaded(page)

    await page.locator('[data-testid="explore-post-card"]').first().click()

    await expect(page.locator('[data-testid="post-modal"]')).toBeVisible({ timeout: 10000 })
  })

  test('클릭한 카드의 postId로 API 요청이 전송된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await setupPostDetailRoutes(page)
    await page.goto('/explore')
    await waitForExploreLoaded(page)

    await page.locator('[data-testid="explore-post-card"]').first().click()
    await expect(page.locator('[data-testid="post-modal"]')).toBeVisible({ timeout: 10000 })

    const captures = await getCaptures(page)
    const detailReq = captures.find(
      (c) => /\/posts\/mock_[a-zA-Z0-9_]+$/.test(c.url) && c.method === 'GET',
    )
    expect(detailReq).toBeDefined()
  })

  test('모달 닫기 버튼 클릭 시 모달이 사라진다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await setupPostDetailRoutes(page)
    await page.goto('/explore')
    await waitForExploreLoaded(page)

    await page.locator('[data-testid="explore-post-card"]').first().click()
    await expect(page.locator('[data-testid="post-modal"]')).toBeVisible({ timeout: 10000 })

    await page.getByRole('button', { name: '닫기' }).click()
    await expect(page.locator('[data-testid="post-modal"]')).toHaveCount(0)
  })

  test('모달 backdrop 클릭 시 모달이 닫힌다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await setupPostDetailRoutes(page)
    await page.goto('/explore')
    await waitForExploreLoaded(page)

    await page.locator('[data-testid="explore-post-card"]').first().click()
    await expect(page.locator('[data-testid="post-modal"]')).toBeVisible({ timeout: 10000 })

    const backdrop = page.locator('[data-testid="post-modal-backdrop"]')
    const box = await backdrop.boundingBox()
    if (!box) throw new Error('backdrop 위치를 찾을 수 없습니다.')
    // 내부 모달 콘텐츠 영역을 피해 좌상단 모서리 클릭
    await page.mouse.click(box.x + 8, box.y + 8)

    await expect(page.locator('[data-testid="post-modal"]')).toHaveCount(0)
  })

  test('모달 닫은 후 다시 다른 카드를 클릭하면 새 모달이 열린다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await setupPostDetailRoutes(page)
    await page.goto('/explore')
    await waitForExploreLoaded(page)

    await page.locator('[data-testid="explore-post-card"]').first().click()
    await expect(page.locator('[data-testid="post-modal"]')).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: '닫기' }).click()
    await expect(page.locator('[data-testid="post-modal"]')).toHaveCount(0)

    await page.locator('[data-testid="explore-post-card"]').nth(1).click()
    await expect(page.locator('[data-testid="post-modal"]')).toBeVisible({ timeout: 10000 })
  })
})

// ─── 7. 게시글 클릭 — 실패 ─────────────────────────────────────────────────────

test.describe('탐색 페이지 — 게시글 클릭 실패', () => {
  test('게시글 상세 API 500 에러 시 모달 내 에러 메시지가 표시된다', async ({ page }) => {
    await bootstrapAuthedPage(page, (_input, method, url) => {
      if (/\/posts\/mock_[a-zA-Z0-9_]+$/.test(url) && method === 'GET') {
        return new Response(
          JSON.stringify({ error_detail: '서버 오류' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        )
      }
      if (/\/comments(\?|$)/.test(url) && method === 'GET') {
        return new Response(
          JSON.stringify({ next: null, results: [] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return null
    })

    await page.goto('/explore')
    await expect(page.locator('[data-testid="explore-post-card"]').first()).toBeVisible({ timeout: 15000 })

    await page.locator('[data-testid="explore-post-card"]').first().click()

    // 모달은 열림 (postModalId가 set됨)
    await expect(page.locator('[data-testid="post-modal"]')).toBeVisible({ timeout: 10000 })
    // 모달 내 에러 메시지
    await expect(page.locator('[data-testid="post-modal"]')).toContainText(
      '게시글을 불러올 수 없습니다.',
      { timeout: 10000 },
    )
  })

  test('게시글 상세 API 지연 중 모달 내 스켈레톤이 표시된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    // POST_DETAIL_STUB은 Node.js 컨텍스트 변수이므로 page.route로 처리, 2초 지연
    await page.route(/\/posts\/mock_[a-zA-Z0-9_]+$/, async (route) => {
      if (route.request().method() !== 'GET') return route.continue()
      await new Promise<void>((resolve) => setTimeout(resolve, 2000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: POST_DETAIL_STUB,
      })
    })

    await page.goto('/explore')
    await expect(page.locator('[data-testid="explore-post-card"]').first()).toBeVisible({ timeout: 15000 })

    await page.locator('[data-testid="explore-post-card"]').first().click()

    await expect(page.locator('[data-testid="post-modal"]')).toBeVisible({ timeout: 5000 })
    // PostModal 로딩 중 animate-pulse 스켈레톤
    await expect(page.locator('[data-testid="post-modal"] .animate-pulse').first()).toBeVisible({ timeout: 3000 })
  })
})

// ─── 8. 무한 스크롤 ─────────────────────────────────────────────────────────────

test.describe('탐색 페이지 — 무한 스크롤', () => {
  test('스크롤 시 다음 페이지가 로드되어 총 24개가 된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/explore')
    await waitForExploreLoaded(page)

    await expect(page.locator('[data-testid="explore-post-card"]')).toHaveCount(12)

    await scrollExploreToBottom(page)

    // 25개 중 page_size=12: 1페이지 12개 + 2페이지 12개 = 24개
    await expect(page.locator('[data-testid="explore-post-card"]')).toHaveCount(24, { timeout: 10000 })
  })

  test('두 번 스크롤 후 전체 25개가 로드되고 추가 요청이 없다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/explore')
    await waitForExploreLoaded(page)

    await scrollExploreToBottom(page)
    await expect(page.locator('[data-testid="explore-post-card"]')).toHaveCount(24, { timeout: 10000 })

    await scrollExploreToBottom(page)
    // 25개 총합 (마지막 페이지: 1개)
    await expect(page.locator('[data-testid="explore-post-card"]')).toHaveCount(25, { timeout: 10000 })

    // 마지막 페이지 도달 후 cursor 요청이 추가로 발생하지 않는다
    const capturesBefore = await getCaptures(page)
    const cursorCountBefore = capturesBefore.filter(
      (c) => /\/posts\/explore\?.*cursor=/.test(c.url) && c.method === 'GET',
    ).length

    await scrollExploreToBottom(page)
    await page.waitForTimeout(500)

    const capturesAfter = await getCaptures(page)
    const cursorCountAfter = capturesAfter.filter(
      (c) => /\/posts\/explore\?.*cursor=/.test(c.url) && c.method === 'GET',
    ).length

    expect(cursorCountAfter).toBe(cursorCountBefore)
  })

  test('다음 페이지 로드 중 로딩 스켈레톤이 표시된다', async ({ page }) => {
    // cursor가 있는 두 번째 페이지 요청에 700ms 지연
    await bootstrapAuthedPage(page, (_input, method, url) => {
      if (/\/posts\/explore\?.*cursor=/.test(url) && method === 'GET') {
        return new Response(
          new ReadableStream({
            start(controller) {
              setTimeout(() => {
                controller.enqueue(
                  new TextEncoder().encode(
                    JSON.stringify({ next: null, results: [] }),
                  ),
                )
                controller.close()
              }, 700)
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return null
    })

    await page.goto('/explore')
    await waitForExploreLoaded(page)

    await scrollExploreToBottom(page)
    await expect(page.locator('[data-testid="explore-loading-more"]')).toBeVisible({ timeout: 3000 })
  })

  test('카테고리 필터 적용 상태에서 스크롤 시 해당 카테고리 데이터만 추가 로드된다', async ({ page }) => {
    // '경상' 카테고리: 9개 → 한 페이지에 모두 들어옴, 다음 페이지 없음
    await bootstrapAuthedPage(page)
    await page.goto('/explore')
    await waitForExploreLoaded(page)

    await page.locator('[data-testid="category-btn-경상"]').click()

    // 경상 총 9개 (< page_size 12) → 첫 페이지에 전부 표시
    await expect(page.locator('[data-testid="explore-post-card"]')).toHaveCount(9, { timeout: 5000 })

    await scrollExploreToBottom(page)

    // 더 이상 로드 없음 — 여전히 9개
    await page.waitForTimeout(1000)
    await expect(page.locator('[data-testid="explore-post-card"]')).toHaveCount(9)
  })
})
