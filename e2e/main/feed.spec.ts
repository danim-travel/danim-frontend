/**
 * 메인 피드(`/`) E2E 테스트
 *
 * @interface-contract
 *   API:
 *     - POST   v1/users/token/refresh         (silent refresh, stub로 주입)
 *     - GET    v1/posts/main?cursor=...       (MSW mainFeed 핸들러)
 *     - POST   v1/posts/:postId/like          (MSW interactions 핸들러)
 *     - DELETE v1/posts/:postId/like
 *     - POST   v1/posts/:postId/bookmark
 *     - DELETE v1/posts/:postId/bookmark
 *
 * 검증 항목:
 *   1. 피드 렌더링 (10개, 닉네임/설명/좋아요/댓글/스팟 뱃지/초기 is_liked/is_bookmarked 상태)
 *   2. 카드 포커스 토글
 *   3. 좋아요 — 낙관적 업데이트 / 토글 / API URL 검증 / 500 롤백
 *   4. 북마크 — 낙관적 업데이트 / 토글 / API URL 검증 / 500 롤백
 *   5. 무한 스크롤 — 페이지 추가 로드 / 마지막 메시지 / 로딩 스피너
 *   6. 피드 API 실패 — 401 → /login 리다이렉트, 500 → 에러 상태
 *
 * MSW authHandlers는 비활성화 상태. silent refresh는 addInitScript로 stub.
 */

import { test, expect, type Page, type Locator } from '@playwright/test'

// ─── 헬퍼 ──────────────────────────────────────────────────────────────────

type CapturedRequest = { url: string; method: string; body: string | null }

/**
 * page.goto 전에 호출해야 한다.
 * - token/refresh 를 200으로 stub해 비로그인 상태에서도 인증된 것처럼 위장.
 * - 추가로 routeOverrides 콜백을 받아 다른 API를 가로챌 수 있게 한다.
 * - 모든 fetch 요청을 __fetchCaptures에 기록한다.
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

          // 1) 사용자 정의 override 우선
          if (overrideFn) {
            const overridden = overrideFn(input, method, url);
            if (overridden) return overridden;
          }

          // 2) token/refresh stub — 항상 200
          if (url.includes('/users/token/refresh') && method === 'POST') {
            return new Response(
              JSON.stringify({ access_token: 'mock_access_token' }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }

          // 3) users/me — authHandlers가 꺼져있으므로 비우고 401로 응답 (accessToken은 이미 setToken으로 유지됨)
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
  return await page.evaluate(
    () => (window as Window & { __fetchCaptures?: CapturedRequest[] }).__fetchCaptures ?? [],
  )
}

/** 피드 첫 번째 카드가 보일 때까지 대기 */
async function waitForFeedLoaded(page: Page) {
  await expect(page.locator('[data-testid="feed-card"]').first()).toBeVisible({ timeout: 15000 })
}

/** 스크롤 컨테이너를 맨 아래까지 스크롤 */
async function scrollFeedToBottom(page: Page) {
  await page.locator('[data-testid="feed-list"]').evaluate((el) => {
    el.scrollTo({ top: el.scrollHeight, behavior: 'instant' })
  })
}

// ─── 1. 피드 렌더링 ────────────────────────────────────────────────────────

test.describe('메인 피드 — 렌더링', () => {
  test('첫 페이지(10개) 카드가 렌더링된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForFeedLoaded(page)
    await expect(page.locator('[data-testid="feed-card"]')).toHaveCount(10)
  })

  test('각 카드에 닉네임/설명/좋아요 카운트가 표시된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForFeedLoaded(page)

    const firstCard = page.locator('[data-testid="feed-card"]').first()
    // mock data: index 0 → 닉네임 '다님이', 설명 '제주도 여행 후기입니다.', like_count = (0*7)%50 = 0
    await expect(firstCard).toContainText('다님이')
    await expect(firstCard).toContainText('제주도 여행 후기입니다.')
    await expect(firstCard.locator('[data-testid="like-count"]')).toHaveText('0')
  })

  test('spot_count > 0 인 카드에는 스팟 뱃지가 표시된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForFeedLoaded(page)

    // 모든 mock 피드는 spot_count = (i % 3) + 1 > 0
    const spotCounts = page.locator('[data-testid="feed-card"] [data-testid="spot-count"]')
    await expect(spotCounts).toHaveCount(10)
    // 첫 카드 spot_count = 1
    await expect(spotCounts.first()).toHaveText('1')
  })

  test('초기 is_liked=true인 카드는 하트가 채워진 상태로 표시된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForFeedLoaded(page)

    // mock: i % 4 === 0 → index 0, 4, 8 의 카드가 is_liked
    const cards = page.locator('[data-testid="feed-card"]')
    const firstHeart = cards.nth(0).locator('[data-testid="like-button"] svg')
    await expect(firstHeart).toHaveClass(/fill-error/)

    // index 1 → is_liked = false
    const secondHeart = cards.nth(1).locator('[data-testid="like-button"] svg')
    await expect(secondHeart).not.toHaveClass(/fill-error/)
  })

  test('초기 is_bookmarked=true인 카드는 북마크가 채워진 상태로 표시된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForFeedLoaded(page)

    // mock: i % 5 === 0 → index 0, 5 의 카드가 is_bookmarked
    const cards = page.locator('[data-testid="feed-card"]')
    const firstBookmark = cards.nth(0).locator('[data-testid="bookmark-button"] svg')
    await expect(firstBookmark).toHaveClass(/fill-primary/)

    const secondBookmark = cards.nth(1).locator('[data-testid="bookmark-button"] svg')
    await expect(secondBookmark).not.toHaveClass(/fill-primary/)
  })
})

// ─── 2. 카드 포커스 ────────────────────────────────────────────────────────

test.describe('메인 피드 — 카드 포커스', () => {
  test('카드 클릭 시 border-primary 클래스가 추가된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForFeedLoaded(page)

    const firstCard = page.locator('[data-testid="feed-card"]').first()
    await expect(firstCard).not.toHaveClass(/border-primary(?!\/)/)

    await firstCard.click()
    await expect(firstCard).toHaveClass(/border-primary/)
  })

  test('다른 카드 클릭 시 이전 카드의 포커스가 해제되고 새 카드가 포커스된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForFeedLoaded(page)

    const cards = page.locator('[data-testid="feed-card"]')
    const first = cards.nth(0)
    const second = cards.nth(1)

    await first.click()
    await expect(first).toHaveClass(/border-primary(?!\/)/)

    await second.click()
    await expect(second).toHaveClass(/border-primary(?!\/)/)
    await expect(first).not.toHaveClass(/border-primary(?!\/)/)
  })
})

// ─── 3. 좋아요 ────────────────────────────────────────────────────────────

test.describe('메인 피드 — 좋아요', () => {
  test('좋아요 미클릭 카드에서 클릭 시 카운트가 +1 된다 (낙관적 업데이트)', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForFeedLoaded(page)

    // index 1 → is_liked=false, like_count=(1*7)%50=7
    const card = page.locator('[data-testid="feed-card"]').nth(1)
    const likeButton = card.locator('[data-testid="like-button"]')
    const likeCount = card.locator('[data-testid="like-count"]')

    await expect(likeCount).toHaveText('7')

    await likeButton.click()
    // 낙관적 업데이트: 즉시 +1
    await expect(likeCount).toHaveText('8')
    await expect(likeButton.locator('svg')).toHaveClass(/fill-error/)
  })

  test('이미 좋아요한 카드를 클릭하면 카운트가 -1 된다 (취소)', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForFeedLoaded(page)

    // index 4 → is_liked=true, like_count=(4*7)%50=28
    const card = page.locator('[data-testid="feed-card"]').nth(4)
    const likeButton = card.locator('[data-testid="like-button"]')
    const likeCount = card.locator('[data-testid="like-count"]')

    await expect(likeCount).toHaveText('28')
    await expect(likeButton.locator('svg')).toHaveClass(/fill-error/)

    await likeButton.click()
    await expect(likeCount).toHaveText('27')
    await expect(likeButton.locator('svg')).not.toHaveClass(/fill-error/)
  })

  test('좋아요 클릭 시 POST posts/{postId}/like 요청이 전송된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForFeedLoaded(page)

    // index 1 → is_liked=false → POST 요청
    const card = page.locator('[data-testid="feed-card"]').nth(1)
    await card.locator('[data-testid="like-button"]').click()

    // 낙관적 업데이트 확인 후 요청 캡처 검증
    await expect(card.locator('[data-testid="like-count"]')).toHaveText('8')

    const captures = await getCaptures(page)
    const likeReq = captures.find(
      (c) => /posts\/mock_01JWPK3N8XQVHM4F2R9BDYC_002\/like$/.test(c.url) && c.method === 'POST',
    )
    expect(likeReq).toBeDefined()
  })

  test('좋아요 API 500 에러 시 카운트가 롤백된다', async ({ page }) => {
    await bootstrapAuthedPage(page, (_input, method, url) => {
      if (/posts\/[^/]+\/like$/.test(url) && method === 'POST') {
        // 300ms 지연 후 500 — 낙관적 업데이트를 먼저 검증하기 위함
        return new Response(
          new ReadableStream({
            start(controller) {
              setTimeout(() => {
                controller.enqueue(
                  new TextEncoder().encode(JSON.stringify({ error_detail: '서버 오류' })),
                )
                controller.close()
              }, 300)
            },
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return null
    })

    await page.goto('/')
    await waitForFeedLoaded(page)

    // index 1: is_liked=false, like_count=7
    const card = page.locator('[data-testid="feed-card"]').nth(1)
    const likeButton = card.locator('[data-testid="like-button"]')
    const likeCount = card.locator('[data-testid="like-count"]')

    await expect(likeCount).toHaveText('7')

    await likeButton.click()
    // 낙관적: 즉시 +1
    await expect(likeCount).toHaveText('8')
    // 에러 응답 후 롤백
    await expect(likeCount).toHaveText('7', { timeout: 3000 })
    await expect(likeButton.locator('svg')).not.toHaveClass(/fill-error/)
  })
})

// ─── 4. 북마크 ────────────────────────────────────────────────────────────

test.describe('메인 피드 — 북마크', () => {
  test('북마크 미클릭 카드에서 클릭 시 fill-primary 상태가 된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForFeedLoaded(page)

    // index 1 → is_bookmarked=false
    const card = page.locator('[data-testid="feed-card"]').nth(1)
    const bookmarkButton = card.locator('[data-testid="bookmark-button"]')
    const icon = bookmarkButton.locator('svg')

    await expect(icon).not.toHaveClass(/fill-primary/)

    await bookmarkButton.click()
    await expect(icon).toHaveClass(/fill-primary/)
  })

  test('이미 북마크한 카드를 클릭하면 fill이 사라진다 (취소)', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForFeedLoaded(page)

    // index 0 → is_bookmarked=true
    const card = page.locator('[data-testid="feed-card"]').nth(0)
    const bookmarkButton = card.locator('[data-testid="bookmark-button"]')
    const icon = bookmarkButton.locator('svg')

    await expect(icon).toHaveClass(/fill-primary/)

    await bookmarkButton.click()
    await expect(icon).not.toHaveClass(/fill-primary/)
  })

  test('북마크 클릭 시 POST posts/{postId}/bookmark 요청이 전송된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForFeedLoaded(page)

    const card = page.locator('[data-testid="feed-card"]').nth(1)
    await card.locator('[data-testid="bookmark-button"]').click()
    await expect(card.locator('[data-testid="bookmark-button"] svg')).toHaveClass(/fill-primary/)

    const captures = await getCaptures(page)
    const req = captures.find(
      (c) => /posts\/mock_01JWPK3N8XQVHM4F2R9BDYC_002\/bookmark$/.test(c.url) && c.method === 'POST',
    )
    expect(req).toBeDefined()
  })

  test('북마크 API 500 에러 시 아이콘이 롤백된다', async ({ page }) => {
    await bootstrapAuthedPage(page, (_input, method, url) => {
      if (/posts\/[^/]+\/bookmark$/.test(url) && method === 'POST') {
        return new Response(
          new ReadableStream({
            start(controller) {
              setTimeout(() => {
                controller.enqueue(
                  new TextEncoder().encode(JSON.stringify({ error_detail: '서버 오류' })),
                )
                controller.close()
              }, 300)
            },
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return null
    })

    await page.goto('/')
    await waitForFeedLoaded(page)

    const card = page.locator('[data-testid="feed-card"]').nth(1)
    const bookmarkButton = card.locator('[data-testid="bookmark-button"]')
    const icon = bookmarkButton.locator('svg')

    await expect(icon).not.toHaveClass(/fill-primary/)

    await bookmarkButton.click()
    // 낙관적
    await expect(icon).toHaveClass(/fill-primary/)
    // 롤백
    await expect(icon).not.toHaveClass(/fill-primary/, { timeout: 3000 })
  })
})

// ─── 5. 무한 스크롤 ────────────────────────────────────────────────────────

test.describe('메인 피드 — 무한 스크롤', () => {
  test('스크롤 시 다음 페이지가 로드되어 총 20개가 된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForFeedLoaded(page)
    await expect(page.locator('[data-testid="feed-card"]')).toHaveCount(10)

    await scrollFeedToBottom(page)
    await expect(page.locator('[data-testid="feed-card"]')).toHaveCount(20, { timeout: 10000 })
  })

  test('두 번 스크롤하면 25개(전체)까지 로드되고 종료 메시지가 표시된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForFeedLoaded(page)

    await scrollFeedToBottom(page)
    await expect(page.locator('[data-testid="feed-card"]')).toHaveCount(20, { timeout: 10000 })

    await scrollFeedToBottom(page)
    await expect(page.locator('[data-testid="feed-card"]')).toHaveCount(25, { timeout: 10000 })

    await expect(page.locator('[data-testid="feed-end"]')).toBeVisible()
    await expect(page.locator('[data-testid="feed-end"]')).toContainText('마지막 게시글입니다')
  })

  test('페이지 로딩 중 스피너가 표시된다', async ({ page }) => {
    // feed 요청 중 cursor가 있는(=다음 페이지) 요청만 700ms 지연 → 스피너 관찰
    await bootstrapAuthedPage(page, (_input, method, url) => {
      if (/\/posts\/main\?.*cursor=/.test(url) && method === 'GET') {
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

    await page.goto('/')
    await waitForFeedLoaded(page)

    await scrollFeedToBottom(page)
    await expect(page.locator('[data-testid="feed-loading-spinner"]')).toBeVisible()
  })
})

// ─── 심층 — 이벤트 전파 ──────────────────────────────────────────────────

test.describe('메인 피드 — 심층 — 이벤트 전파', () => {
  test('좋아요 버튼 클릭이 카드 포커스를 변경하지 않는다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForFeedLoaded(page)

    const cards = page.locator('[data-testid="feed-card"]')
    const second = cards.nth(1)
    const third = cards.nth(2)

    // 두 번째 카드 포커스
    await second.click()
    await expect(second).toHaveClass(/border-primary(?!\/)/)

    // 세 번째 카드의 좋아요 버튼 클릭 — 카드 포커스가 옮겨가면 안 됨
    await third.locator('[data-testid="like-button"]').click()

    // 두 번째 카드 포커스 유지, 세 번째 카드는 포커스되지 않음
    await expect(second).toHaveClass(/border-primary(?!\/)/)
    await expect(third).not.toHaveClass(/border-primary(?!\/)/)
  })

  test('북마크 버튼 클릭이 카드 포커스를 변경하지 않는다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForFeedLoaded(page)

    const cards = page.locator('[data-testid="feed-card"]')
    const second = cards.nth(1)
    const third = cards.nth(2)

    await second.click()
    await expect(second).toHaveClass(/border-primary(?!\/)/)

    await third.locator('[data-testid="bookmark-button"]').click()

    await expect(second).toHaveClass(/border-primary(?!\/)/)
    await expect(third).not.toHaveClass(/border-primary(?!\/)/)
  })

  test('좋아요 버튼 클릭 시 카운트만 변경되고 카드 포커스 상태는 유지된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForFeedLoaded(page)

    const cards = page.locator('[data-testid="feed-card"]')
    const second = cards.nth(1)

    // 두 번째 카드 포커스
    await second.click()
    await expect(second).toHaveClass(/border-primary(?!\/)/)

    const likeCount = second.locator('[data-testid="like-count"]')
    const before = Number(((await likeCount.textContent()) ?? '0').trim())

    // 같은(포커스된) 카드의 좋아요 클릭 — 포커스는 유지되어야 함
    await second.locator('[data-testid="like-button"]').click()

    await expect(likeCount).toHaveText(String(before + 1))
    await expect(second).toHaveClass(/border-primary(?!\/)/)
  })
})

// ─── 6. 피드 API 실패 ──────────────────────────────────────────────────────

test.describe('메인 피드 — API 실패', () => {
  test('token/refresh 실패 시 /login으로 리다이렉트된다', async ({ page }) => {
    // bootstrapAuthedPage를 사용하지 않고 직접 fetch override —
    // token/refresh를 401로 만들면 apiClient의 acquireRefreshedToken이 clearAuth() + redirect 를 트리거한다.
    await page.addInitScript(() => {
      const orig = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : String(input)
        const method = input instanceof Request ? input.method : (init?.method ?? 'GET')
        if (url.includes('/users/token/refresh') && method === 'POST') {
          return new Response(
            JSON.stringify({ error_detail: '만료된 토큰' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } },
          )
        }
        return orig(input, init)
      }
    })

    await page.goto('/')
    await page.waitForURL('/login', { timeout: 10000 })
    await expect(page).toHaveURL('/login')
  })

  test('GET posts/main 지속적 401 시 피드 카드가 렌더링되지 않는다', async ({ page }) => {
    // token/refresh는 성공하되 posts/main은 재시도 후에도 401을 반환하는 시나리오
    // apiClient: 401 → refresh(성공) → 재시도(401, x-is-retry) → error 반환 → TanStack Query error 상태
    await bootstrapAuthedPage(page, (_input, method, url) => {
      if (/\/posts\/main(\?|$)/.test(url) && method === 'GET') {
        return new Response(
          JSON.stringify({ error_detail: '인증되지 않은 사용자입니다.' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return null
    })

    await page.goto('/')
    await expect(page.locator('[data-testid="feed-list"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-testid="feed-card"]')).toHaveCount(0)
  })

  test('GET posts/main 500 → 피드 카드가 렌더링되지 않는다', async ({ page }) => {
    await bootstrapAuthedPage(page, (_input, method, url) => {
      if (/\/posts\/main(\?|$)/.test(url) && method === 'GET') {
        return new Response(
          JSON.stringify({ error_detail: '서버 오류' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return null
    })

    await page.goto('/')

    // 피드 패널은 렌더링되지만 카드는 없어야 한다.
    await expect(page.locator('[data-testid="feed-list"]')).toBeVisible({ timeout: 10000 })

    // 카드가 0개여야 한다 (잠시 대기 후 확인)
    const cards: Locator = page.locator('[data-testid="feed-card"]')
    await expect(cards).toHaveCount(0)
  })
})
