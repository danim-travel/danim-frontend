/**
 * PostModal E2E 테스트
 *
 * @interface-contract
 *   API:
 *     - POST   v1/users/token/refresh         (silent refresh, stub로 주입)
 *     - GET    v1/posts/main?cursor=...       (MSW mainFeed 핸들러, 메인 진입용)
 *     - GET    v1/posts/:postId               (MSW posts 핸들러 — showcase-post)
 *     - GET    v1/comments?post_id=...        (MSW comments 핸들러)
 *     - POST   v1/comments                    (MSW comments 핸들러 — 댓글 생성)
 *     - POST   v1/posts/:postId/like          (MSW interactions 핸들러)
 *     - DELETE v1/posts/:postId/like
 *     - POST   v1/posts/:postId/bookmark      (MSW interactions 핸들러)
 *     - DELETE v1/posts/:postId/bookmark
 *     - POST   v1/comments/:commentId/like    (MSW interactions 핸들러)
 *     - DELETE v1/comments/:commentId/like
 *
 * 검증 항목:
 *   1. 모달 열기 / 닫기 (X 버튼, backdrop, Escape)
 *   2. 모달 콘텐츠 (작성자, 좋아요 카운트, 댓글 개수, 댓글 입력창)
 *   3. 모달 내 좋아요 — 낙관적 +1/-1, 500 롤백
 *   4. 모달 내 북마크 — 토글
 *   5. 댓글 작성 — 전송 버튼, Enter, 입력창 초기화, disabled
 *   6. 댓글 좋아요 — aria-label 토글
 *   7. 로딩/에러 상태
 *
 * MSW posts 핸들러는 brief하게 상태를 공유하므로(in-memory),
 * 카운트 비교는 가능한 한 "현재 표시값" 기준 상대 비교를 사용한다.
 */

import { test, expect, type Page } from '@playwright/test'

// ─── 헬퍼 ──────────────────────────────────────────────────────────────────

type CapturedRequest = { url: string; method: string; body: string | null }

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

          // 3) users/me — authHandlers가 꺼져있으므로 401
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

/** 메인 진입 후 PostModal 을 직접 열기 */
async function openModal(page: Page, postId = 'showcase-post') {
  // window.__openPostModal 이 등록될 때까지 대기 (Providers useEffect 이후)
  await page.waitForFunction(
    () => typeof (window as Window & { __openPostModal?: (id: string) => void }).__openPostModal === 'function',
    null,
    { timeout: 10000 },
  )
  await page.evaluate(
    (id) => (window as Window & { __openPostModal?: (id: string) => void }).__openPostModal?.(id),
    postId,
  )
  await expect(page.locator('[data-testid="post-modal"]')).toBeVisible({ timeout: 10000 })
}

/** 첫 카드가 보일 때까지 대기 — 메인 페이지 진입 완료 신호 */
async function waitForMainLoaded(page: Page) {
  await expect(page.locator('[data-testid="feed-card"]').first()).toBeVisible({ timeout: 15000 })
}

// ─── 1. 모달 열기 / 닫기 ───────────────────────────────────────────────────

test.describe('PostModal — 모달 열기/닫기', () => {
  test('openPostModal 호출 시 모달이 표시된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForMainLoaded(page)
    await openModal(page)
    await expect(page.locator('[data-testid="post-modal"]')).toBeVisible()
  })

  test('닫기 버튼(X) 클릭 시 모달이 사라진다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForMainLoaded(page)
    await openModal(page)

    await page.getByRole('button', { name: '닫기' }).click()
    await expect(page.locator('[data-testid="post-modal"]')).toHaveCount(0)
  })

  test('backdrop 클릭 시 모달이 닫힌다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForMainLoaded(page)
    await openModal(page)

    // backdrop 좌상단 모서리 클릭 — 내부 모달 콘텐츠 영역을 피해 클릭
    const backdrop = page.locator('[data-testid="post-modal-backdrop"]')
    const box = await backdrop.boundingBox()
    if (!box) throw new Error('backdrop 위치를 찾을 수 없습니다.')
    await page.mouse.click(box.x + 8, box.y + 8)

    await expect(page.locator('[data-testid="post-modal"]')).toHaveCount(0)
  })

  test('Escape 키를 누르면 모달이 닫힌다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForMainLoaded(page)
    await openModal(page)

    await page.keyboard.press('Escape')
    await expect(page.locator('[data-testid="post-modal"]')).toHaveCount(0)
  })
})

// ─── 2. 모달 콘텐츠 ───────────────────────────────────────────────────────

test.describe('PostModal — 모달 콘텐츠', () => {
  test('게시글 작성자 닉네임이 표시된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForMainLoaded(page)
    await openModal(page)

    await expect(page.locator('[data-testid="post-modal"]')).toContainText('다님이')
  })

  test('좋아요 카운트가 숫자로 표시된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForMainLoaded(page)
    await openModal(page)

    const likeCount = page.locator('[data-testid="modal-like-count"]')
    await expect(likeCount).toBeVisible()
    const text = (await likeCount.textContent()) ?? ''
    expect(text.trim()).toMatch(/^\d+$/)
  })

  test('댓글 섹션 레이블 "댓글"이 표시된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForMainLoaded(page)
    await openModal(page)

    await expect(page.locator('[data-testid="post-modal"]')).toContainText('댓글')
  })

  test('mock data 기준 댓글 3개가 표시된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForMainLoaded(page)
    await openModal(page)

    // mock data: comment-1, comment-2, comment-3 (단, 이전 테스트에서 댓글 생성 가능 → 최소 3개)
    const items = page.locator('[data-testid="comment-item"]')
    await expect(items.first()).toBeVisible({ timeout: 10000 })
    const count = await items.count()
    expect(count).toBeGreaterThanOrEqual(3)
  })

  test('댓글 입력창이 표시된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForMainLoaded(page)
    await openModal(page)

    await expect(page.locator('[data-testid="comment-input"]')).toBeVisible()
  })

  test('비어있는 댓글 입력 시 전송 버튼이 비활성화된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForMainLoaded(page)
    await openModal(page)

    const submit = page.getByRole('button', { name: '전송' })
    await expect(submit).toBeDisabled()
  })
})

// ─── 3. 모달 내 좋아요 ────────────────────────────────────────────────────

test.describe('PostModal — 좋아요', () => {
  test('좋아요 클릭 시 카운트가 +1 된다 (낙관적)', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForMainLoaded(page)
    await openModal(page)

    const likeBtn = page.locator('[data-testid="modal-like-button"]')
    const likeCount = page.locator('[data-testid="modal-like-count"]')

    const before = Number(((await likeCount.textContent()) ?? '0').trim())
    await likeBtn.click()
    await expect(likeCount).toHaveText(String(before + 1))
  })

  test('좋아요 → 재클릭(취소) 시 카운트가 -1 된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForMainLoaded(page)
    await openModal(page)

    const likeBtn = page.locator('[data-testid="modal-like-button"]')
    const likeCount = page.locator('[data-testid="modal-like-count"]')

    const before = Number(((await likeCount.textContent()) ?? '0').trim())
    // 첫 클릭 → 좋아요 상태로 토글
    await likeBtn.click()
    await expect(likeCount).toHaveText(String(before + 1))
    // 두 번째 클릭 → 취소 (낙관적: 즉시 -1)
    await likeBtn.click()
    await expect(likeCount).toHaveText(String(before))
  })

  test('like API 500 에러 시 카운트가 롤백된다', async ({ page }) => {
    await bootstrapAuthedPage(page, (_input, method, url) => {
      if (/posts\/showcase-post\/like$/.test(url) && (method === 'POST' || method === 'DELETE')) {
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
    await waitForMainLoaded(page)
    await openModal(page)

    const likeBtn = page.locator('[data-testid="modal-like-button"]')
    const likeCount = page.locator('[data-testid="modal-like-count"]')
    const before = Number(((await likeCount.textContent()) ?? '0').trim())

    await likeBtn.click()
    // 낙관적: 즉시 변화 (+1 또는 -1 — 초기 상태에 따라)
    await expect(likeCount).not.toHaveText(String(before))
    // 에러 응답 후 롤백
    await expect(likeCount).toHaveText(String(before), { timeout: 3000 })
  })
})

// ─── 4. 모달 내 북마크 ────────────────────────────────────────────────────

test.describe('PostModal — 북마크', () => {
  test('북마크 클릭 시 아이콘이 채워진 상태가 된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForMainLoaded(page)
    await openModal(page)

    const bookmarkBtn = page.locator('[data-testid="modal-bookmark-button"]')
    const icon = bookmarkBtn.locator('svg')

    const initiallyFilled = (await icon.getAttribute('fill')) === 'currentColor'

    await bookmarkBtn.click()

    if (initiallyFilled) {
      await expect(icon).toHaveAttribute('fill', 'none')
    } else {
      await expect(icon).toHaveAttribute('fill', 'currentColor')
      await expect(icon).toHaveClass(/text-primary/)
    }
  })

  test('재클릭 시 토글된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForMainLoaded(page)
    await openModal(page)

    const bookmarkBtn = page.locator('[data-testid="modal-bookmark-button"]')
    const icon = bookmarkBtn.locator('svg')
    const initialFill = await icon.getAttribute('fill')

    await bookmarkBtn.click()
    await expect(icon).not.toHaveAttribute('fill', initialFill ?? '')

    await bookmarkBtn.click()
    await expect(icon).toHaveAttribute('fill', initialFill ?? '')
  })
})

// ─── 5. 댓글 작성 ─────────────────────────────────────────────────────────

test.describe('PostModal — 댓글 작성', () => {
  test('댓글 입력 후 전송 버튼 클릭 시 댓글이 추가된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForMainLoaded(page)
    await openModal(page)

    const input = page.locator('[data-testid="comment-input"]')
    const items = page.locator('[data-testid="comment-item"]')
    await expect(items.first()).toBeVisible({ timeout: 5000 })

    const before = await items.count()
    await input.fill('E2E 테스트 댓글입니다.')
    await page.getByRole('button', { name: '전송' }).click()

    await expect(items).toHaveCount(before + 1, { timeout: 5000 })
  })

  test('전송 후 입력창이 비워진다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForMainLoaded(page)
    await openModal(page)

    const input = page.locator('[data-testid="comment-input"]')
    await input.fill('초기화 검증 댓글')
    await page.getByRole('button', { name: '전송' }).click()

    await expect(input).toHaveValue('', { timeout: 5000 })
  })

  test('Enter 키로도 전송된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForMainLoaded(page)
    await openModal(page)

    const input = page.locator('[data-testid="comment-input"]')
    const items = page.locator('[data-testid="comment-item"]')
    // 댓글 목록이 로드될 때까지 대기 후 기준값 확보
    await expect(items.first()).toBeVisible({ timeout: 5000 })
    const before = await items.count()

    await input.fill('Enter 키 전송 테스트')
    await input.press('Enter')

    await expect(items).toHaveCount(before + 1, { timeout: 5000 })
  })

  test('공백만 입력 시 전송 버튼이 disabled 상태다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForMainLoaded(page)
    await openModal(page)

    const input = page.locator('[data-testid="comment-input"]')
    await input.fill('     ')

    const submit = page.getByRole('button', { name: '전송' })
    await expect(submit).toBeDisabled()
  })
})

// ─── 6. 댓글 좋아요 ───────────────────────────────────────────────────────

test.describe('PostModal — 댓글 좋아요', () => {
  test('첫 번째 댓글 좋아요 클릭 시 aria-label이 토글된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForMainLoaded(page)
    await openModal(page)

    const firstComment = page.locator('[data-testid="comment-item"]').first()
    // 첫 번째 댓글의 좋아요 버튼 (aria-label이 '좋아요' 또는 '좋아요 취소')
    const likeBtn = firstComment.locator('button[aria-label="좋아요"], button[aria-label="좋아요 취소"]')

    const initialLabel = await likeBtn.getAttribute('aria-label')
    const toggledLabel = initialLabel === '좋아요' ? '좋아요 취소' : '좋아요'

    await likeBtn.click()
    await expect(likeBtn).toHaveAttribute('aria-label', toggledLabel)

    // 다시 클릭 시 원래대로
    await likeBtn.click()
    await expect(likeBtn).toHaveAttribute('aria-label', initialLabel ?? '좋아요')
  })

  test('댓글 좋아요 API 요청이 전송된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForMainLoaded(page)
    await openModal(page)

    const firstComment = page.locator('[data-testid="comment-item"]').first()
    const likeBtn = firstComment.locator('button[aria-label="좋아요"], button[aria-label="좋아요 취소"]')

    await likeBtn.click()
    // aria 라벨이 한 번 바뀔 때까지 대기 — 후속 fetch capture 검증
    await page.waitForTimeout(300)

    const captures = await getCaptures(page)
    const req = captures.find(
      (c) =>
        /comments\/[^/]+\/like$/.test(c.url) && (c.method === 'POST' || c.method === 'DELETE'),
    )
    expect(req).toBeDefined()
  })
})

// ─── 7. 로딩 / 에러 상태 ──────────────────────────────────────────────────

test.describe('PostModal — 로딩/에러', () => {
  test('API 지연 중 스켈레톤 (animate-pulse) 이 표시된다', async ({ page }) => {
    await bootstrapAuthedPage(page, (_input, method, url) => {
      if (/\/posts\/showcase-post(\?|$)/.test(url) && method === 'GET') {
        return new Response(
          new ReadableStream({
            start(controller) {
              setTimeout(() => {
                controller.enqueue(
                  new TextEncoder().encode(JSON.stringify({ error_detail: '서버 오류' })),
                )
                controller.close()
              }, 1500)
            },
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return null
    })

    await page.goto('/')
    await waitForMainLoaded(page)
    await openModal(page)

    // 모달 내부에 animate-pulse 클래스가 존재해야 함 (UserRowSkeleton)
    const skeleton = page.locator('[data-testid="post-modal"] .animate-pulse').first()
    await expect(skeleton).toBeVisible({ timeout: 3000 })
  })

  test('API 500 에러 시 에러 메시지가 표시된다', async ({ page }) => {
    await bootstrapAuthedPage(page, (_input, method, url) => {
      if (/\/posts\/showcase-post(\?|$)/.test(url) && method === 'GET') {
        return new Response(
          JSON.stringify({ error_detail: '서버 오류' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return null
    })

    await page.goto('/')
    await waitForMainLoaded(page)
    await openModal(page)

    await expect(page.locator('[data-testid="post-modal"]')).toContainText(
      '게시글을 불러올 수 없습니다.',
      { timeout: 10000 },
    )
  })
})

// ─── 8. 스팟 탭 전환 ────────────────────────────────────────────────────────
// showcase-post: spots[0] = 성산일출봉, spots[1] = 섭지코지

test.describe('PostModal — 스팟 탭 전환', () => {
  test('초기 활성 스팟은 첫 번째 장소명이 표시된다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForMainLoaded(page)
    await openModal(page)

    await expect(page.locator('[data-testid="post-modal"]')).toContainText('성산일출봉', { timeout: 5000 })
  })

  test('스텝퍼 2번 클릭 시 두 번째 장소명으로 바뀐다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForMainLoaded(page)
    await openModal(page)

    // Stepper 버튼은 숫자(1, 2)로 렌더링됨 — DetailPane의 active-spot-title로 확인
    const spotTitle = page.locator('[data-testid="active-spot-title"]')
    await expect(spotTitle).toHaveText('성산일출봉', { timeout: 5000 })

    await page.locator('[data-testid="post-modal"]').getByRole('button', { name: '2', exact: true }).click()
    await expect(spotTitle).toHaveText('섭지코지', { timeout: 3000 })
  })

  test('스텝퍼 2번 → 1번 클릭 시 첫 번째 장소로 돌아온다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForMainLoaded(page)
    await openModal(page)

    const spotTitle = page.locator('[data-testid="active-spot-title"]')
    const modal = page.locator('[data-testid="post-modal"]')

    await modal.getByRole('button', { name: '2', exact: true }).click()
    await expect(spotTitle).toHaveText('섭지코지', { timeout: 3000 })

    await modal.getByRole('button', { name: '1', exact: true }).click()
    await expect(spotTitle).toHaveText('성산일출봉', { timeout: 3000 })
  })
})

// ─── 9. 댓글 수정/삭제 (소유자 댓글) ────────────────────────────────────────
// 새로 작성한 댓글은 SHOWCASE_MOCK_USER_ID 소유 → isOwn=true → 케밥 메뉴 노출

test.describe('PostModal — 댓글 수정/삭제', () => {
  async function createOwnComment(page: Page, content: string) {
    const input = page.locator('[data-testid="comment-input"]')
    await input.fill(content)
    await page.getByRole('button', { name: '전송' }).click()
    // 내 댓글이 목록에 추가될 때까지 대기
    await expect(page.locator('[data-testid="comment-item"]').last()).toContainText(content, { timeout: 5000 })
  }

  test('내 댓글에 호버 시 케밥 메뉴(더보기 버튼)가 나타난다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForMainLoaded(page)
    await openModal(page)
    await createOwnComment(page, '수정 테스트 댓글')

    const myComment = page.locator('[data-testid="comment-item"]').last()
    await myComment.hover()
    await expect(myComment.getByRole('button', { name: '더보기' })).toBeVisible()
  })

  test('케밥 → 수정 클릭 시 인라인 에디터가 열린다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForMainLoaded(page)
    await openModal(page)
    await createOwnComment(page, '인라인 편집 테스트')

    const myComment = page.locator('[data-testid="comment-item"]').last()
    await myComment.hover()
    await myComment.getByRole('button', { name: '더보기' }).click()
    await page.getByRole('button', { name: '수정' }).click()

    // 인라인 input이 현재 내용으로 채워진 채로 열려야 함
    await expect(myComment.locator('input')).toBeVisible()
    await expect(myComment.locator('input')).toHaveValue('인라인 편집 테스트')
  })

  test('수정 후 저장하면 댓글 내용이 바뀐다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForMainLoaded(page)
    await openModal(page)
    await createOwnComment(page, '수정 전 내용')

    const myComment = page.locator('[data-testid="comment-item"]').last()
    await myComment.hover()
    await myComment.getByRole('button', { name: '더보기' }).click()
    await page.getByRole('button', { name: '수정' }).click()

    const editInput = myComment.locator('input')
    await editInput.clear()
    await editInput.fill('수정 후 내용')
    await myComment.getByRole('button', { name: '저장' }).click()

    await expect(myComment).toContainText('수정 후 내용', { timeout: 5000 })
    await expect(myComment).not.toContainText('수정 전 내용')
  })

  test('삭제 클릭 시 댓글이 목록에서 사라진다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForMainLoaded(page)
    await openModal(page)
    await createOwnComment(page, '삭제될 댓글')

    const items = page.locator('[data-testid="comment-item"]')
    const beforeCount = await items.count()

    const myComment = items.last()
    await myComment.hover()
    await myComment.getByRole('button', { name: '더보기' }).click()
    await page.getByRole('button', { name: '삭제' }).click()

    await expect(items).toHaveCount(beforeCount - 1, { timeout: 5000 })
  })

  test('수정 중 취소 버튼 클릭 시 원래 내용으로 돌아온다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForMainLoaded(page)
    await openModal(page)
    await createOwnComment(page, '취소 테스트 댓글')

    const myComment = page.locator('[data-testid="comment-item"]').last()
    await myComment.hover()
    await myComment.getByRole('button', { name: '더보기' }).click()
    await page.getByRole('button', { name: '수정' }).click()

    const editInput = myComment.locator('input')
    await editInput.fill('이 내용은 저장되면 안 됨')
    await myComment.getByRole('button', { name: '취소' }).click()

    await expect(myComment).toContainText('취소 테스트 댓글')
    await expect(myComment.locator('input')).not.toBeVisible()
  })
})

// ─── 10. 피드 캐시 독립성 ────────────────────────────────────────────────────
// queryKeys.posts.mainFeed vs queryKeys.posts.detail 은 별개 캐시

test.describe('PostModal — 피드 ↔ 모달 캐시 독립성', () => {
  test('모달에서 좋아요해도 피드 카드 카운트는 변하지 않는다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForMainLoaded(page)

    // 피드 카드 첫 번째 like_count 기준값 저장 (index 0: like_count=0)
    const feedLikeCount = page.locator('[data-testid="feed-card"]').nth(0).locator('[data-testid="like-count"]')
    await expect(feedLikeCount).toBeVisible()
    const feedBefore = await feedLikeCount.textContent()

    // 모달 오픈 → 모달 like_count 기준값 저장
    await openModal(page)
    const modalCount = page.locator('[data-testid="modal-like-count"]')
    await expect(modalCount).toBeVisible({ timeout: 5000 })
    const modalBefore = parseInt((await modalCount.textContent()) ?? '0')

    // 모달 좋아요 클릭 → 카운트 +1 확인
    await page.locator('[data-testid="modal-like-button"]').click()
    await expect(modalCount).toHaveText(String(modalBefore + 1), { timeout: 3000 })

    // 모달 닫기
    await page.getByRole('button', { name: '닫기' }).click()
    await expect(page.locator('[data-testid="post-modal"]')).not.toBeVisible()

    // 피드 카드 카운트는 그대로여야 함 (독립 캐시 — showcase-post ≠ 피드 mock post)
    await expect(feedLikeCount).toHaveText(feedBefore!)
  })

  test('피드 카드 좋아요가 모달의 like_count에 영향을 주지 않는다', async ({ page }) => {
    await bootstrapAuthedPage(page)
    await page.goto('/')
    await waitForMainLoaded(page)

    // 모달 오픈 → 모달 내 like_count 확인
    await openModal(page)
    const modalCount = page.locator('[data-testid="modal-like-count"]')
    await expect(modalCount).toBeVisible({ timeout: 5000 })
    const modalBefore = await modalCount.textContent()

    // 모달 닫고 피드 카드 좋아요 클릭
    await page.getByRole('button', { name: '닫기' }).click()
    const feedCard = page.locator('[data-testid="feed-card"]').nth(1) // index 1: is_liked=false
    await feedCard.locator('[data-testid="like-button"]').click()
    await expect(feedCard.locator('[data-testid="like-count"]')).toHaveText('8')

    // 다시 모달 오픈 → 모달 like_count 변하지 않아야 함 (독립 캐시)
    await openModal(page)
    await expect(modalCount).toHaveText(modalBefore!)
  })
})

// ─── 11. isPending 중복 클릭 방지 ───────────────────────────────────────────
// ActionBar: if (postLikeMutation.isPending) return; → 두 번 클릭해도 요청 1회

test.describe('PostModal — 중복 클릭 방지', () => {
  test('좋아요 연속 클릭 시 API 요청이 1번만 전송된다', async ({ page }) => {
    // like 엔드포인트를 400ms 지연시켜 isPending 상태를 길게 유지
    await bootstrapAuthedPage(page, (_input, method, url) => {
      if (/\/posts\/showcase-post\/like$/.test(url) && method === 'POST') {
        return new Response(
          new ReadableStream({
            start(controller) {
              setTimeout(() => {
                controller.enqueue(
                  new TextEncoder().encode(JSON.stringify({ is_liked: true, like_count: 25 })),
                )
                controller.close()
              }, 400)
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return null
    })

    await page.goto('/')
    await waitForMainLoaded(page)
    await openModal(page)

    const likeBtn = page.locator('[data-testid="modal-like-button"]')
    await expect(likeBtn).toBeVisible({ timeout: 5000 })

    // 첫 클릭 → isPending=true, 두 번째 클릭은 isPending 가드로 무시됨
    await likeBtn.click()
    await likeBtn.click()

    // 400ms 응답 완료 대기
    await page.waitForTimeout(600)

    const captures = await getCaptures(page)
    const likeRequests = captures.filter(
      (c) => /\/posts\/showcase-post\/like$/.test(c.url) && c.method === 'POST',
    )
    expect(likeRequests).toHaveLength(1)
  })

  test('북마크 연속 클릭 시 API 요청이 1번만 전송된다', async ({ page }) => {
    await bootstrapAuthedPage(page, (_input, method, url) => {
      if (/\/posts\/showcase-post\/bookmark$/.test(url) && method === 'POST') {
        return new Response(
          new ReadableStream({
            start(controller) {
              setTimeout(() => {
                controller.enqueue(
                  new TextEncoder().encode(JSON.stringify({ is_bookmarked: true, bookmark_count: 1 })),
                )
                controller.close()
              }, 400)
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return null
    })

    await page.goto('/')
    await waitForMainLoaded(page)
    await openModal(page)

    const bookmarkBtn = page.locator('[data-testid="modal-bookmark-button"]')
    await expect(bookmarkBtn).toBeVisible({ timeout: 5000 })

    await bookmarkBtn.click()
    await bookmarkBtn.click()

    await page.waitForTimeout(600)

    const captures = await getCaptures(page)
    const bookmarkRequests = captures.filter(
      (c) => /\/posts\/showcase-post\/bookmark$/.test(c.url) && c.method === 'POST',
    )
    expect(bookmarkRequests).toHaveLength(1)
  })
})
