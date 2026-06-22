/**
 * 마이페이지 — API 에러 시나리오 종합 E2E 테스트
 *
 * 검증 항목:
 *  [인증 에러]
 *  - token/refresh 401 → 비로그인 안내
 *  - token/refresh 네트워크 오류 → 비로그인 안내
 *  - getCurrentUser 실패 → 비로그인 안내
 *
 *  [프로필 에러]
 *  - GET /users/:id/profile 404 → 에러 안내
 *  - GET /users/:id/profile 500 → 에러 안내
 *  - GET /users/:id/profile 네트워크 오류 → 에러 안내
 *
 *  [좋아요 에러]
 *  - POST /posts/:id/like 실패 → optimistic rollback
 *  - DELETE /posts/:id/like 실패 → optimistic rollback
 *
 *  [북마크 에러]
 *  - POST /posts/:id/bookmark 실패 → optimistic rollback
 *
 *  [댓글 에러]
 *  - POST /comments 실패 → 에러 토스트, 입력란 유지
 *  - GET /comments 실패 → 댓글 영역 미표시 (앱 크래시 없음)
 *
 *  [게시글 삭제 에러]
 *  - DELETE /posts/:id 실패 → 에러 토스트
 */

import { test, expect, type Page } from '@playwright/test'
import {
  setupMyPageWithModal,
  openFirstPostModal,
  MOCK_POST_DETAIL,
  MOCK_USER_ID,
  MOCK_PROFILE,
  MOCK_COMMENTS,
} from './helpers'

// ─── 인증 에러 ───────────────────────────────────────────────────────────────

test.describe('인증 에러', () => {
  // AuthGuard가 비로그인 상태(isHydrated=true, userId=null)를 감지하면 /login으로 리다이렉트한다.

  test('token/refresh 401 → /login으로 리다이렉트된다', async ({ page }) => {
    await page.addInitScript(() => {
      const orig = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : String(input)
        const method = input instanceof Request ? input.method : (init?.method ?? 'GET')
        if (url.includes('users/token/refresh') && method === 'POST') {
          return new Response(
            JSON.stringify({ error_detail: '유효하지 않은 토큰입니다.' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } },
          )
        }
        return orig(input, init)
      }
    })
    await page.goto('/mypage')
    await expect(page).toHaveURL('/login', { timeout: 8_000 })
  })

  test('token/refresh 네트워크 오류 → /login으로 리다이렉트된다', async ({ page }) => {
    await page.addInitScript(() => {
      const orig = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : String(input)
        const method = input instanceof Request ? input.method : (init?.method ?? 'GET')
        if (url.includes('users/token/refresh') && method === 'POST') {
          throw new TypeError('Failed to fetch')
        }
        return orig(input, init)
      }
    })
    await page.goto('/mypage')
    await expect(page).toHaveURL('/login', { timeout: 8_000 })
  })

  test('token/refresh 성공 + getCurrentUser 500 → "로그인이 필요합니다." 안내가 표시된다', async ({ page }) => {
    await page.addInitScript(() => {
      const orig = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : String(input)
        const method = input instanceof Request ? input.method : (init?.method ?? 'GET')
        if (url.includes('users/token/refresh') && method === 'POST') {
          return new Response(
            JSON.stringify({ access_token: 'mock_access_token' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }
        if (url.includes('users/me') && method === 'GET') {
          return new Response(
            JSON.stringify({ error_detail: '내부 서버 오류' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          )
        }
        return orig(input, init)
      }
    })
    await page.goto('/mypage')
    // accessToken은 유지되므로 AuthGuard는 리다이렉트하지 않고, MyPage가 userId=null 상태로 안내문을 표시한다.
    await expect(page.getByText('로그인이 필요합니다.')).toBeVisible({ timeout: 8_000 })
  })

  test('token/refresh 성공 + getCurrentUser 네트워크 오류 → "로그인이 필요합니다." 안내가 표시된다', async ({ page }) => {
    await page.addInitScript(() => {
      const orig = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : String(input)
        const method = input instanceof Request ? input.method : (init?.method ?? 'GET')
        if (url.includes('users/token/refresh') && method === 'POST') {
          return new Response(
            JSON.stringify({ access_token: 'mock_access_token' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }
        if (url.includes('users/me') && method === 'GET') {
          throw new TypeError('Failed to fetch')
        }
        return orig(input, init)
      }
    })
    await page.goto('/mypage')
    // accessToken은 유지되므로 AuthGuard는 리다이렉트하지 않고, MyPage가 userId=null 상태로 안내문을 표시한다.
    await expect(page.getByText('로그인이 필요합니다.')).toBeVisible({ timeout: 8_000 })
  })
})

// ─── 프로필 API 에러 ──────────────────────────────────────────────────────────

function buildAuthStubWithProfileError(page: Page, profileStatus: number) {
  return page.addInitScript(
    (args: { userId: string; status: number }) => {
      const orig = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : String(input)
        const method = input instanceof Request ? input.method : (init?.method ?? 'GET')
        if (url.includes('users/token/refresh') && method === 'POST') {
          return new Response(
            JSON.stringify({ access_token: 'mock_access_token' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }
        if (url.includes('users/me') && method === 'GET') {
          return new Response(
            JSON.stringify({ user_id: args.userId, nickname: 'test_nickname', profile_img: null }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }
        if (url.includes(`users/${args.userId}/profile`) && method === 'GET') {
          return new Response(
            JSON.stringify({ error_detail: '에러 발생' }),
            { status: args.status, headers: { 'Content-Type': 'application/json' } },
          )
        }
        return orig(input, init)
      }
    },
    { userId: MOCK_USER_ID, status: profileStatus },
  )
}

test.describe('프로필 API 에러', () => {
  test('GET /users/:id/profile 404 → "프로필을 불러올 수 없습니다." 표시', async ({ page }) => {
    await buildAuthStubWithProfileError(page, 404)
    await page.goto('/mypage')
    await expect(page.getByText('프로필을 불러올 수 없습니다.')).toBeVisible({ timeout: 8_000 })
  })

  test('GET /users/:id/profile 500 → "프로필을 불러올 수 없습니다." 표시', async ({ page }) => {
    await buildAuthStubWithProfileError(page, 500)
    await page.goto('/mypage')
    await expect(page.getByText('프로필을 불러올 수 없습니다.')).toBeVisible({ timeout: 8_000 })
  })

  test('GET /users/:id/profile 네트워크 오류 → "프로필을 불러올 수 없습니다." 표시', async ({ page }) => {
    await page.addInitScript((userId: string) => {
      const orig = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : String(input)
        const method = input instanceof Request ? input.method : (init?.method ?? 'GET')
        if (url.includes('users/token/refresh') && method === 'POST') {
          return new Response(
            JSON.stringify({ access_token: 'mock_access_token' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }
        if (url.includes('users/me') && method === 'GET') {
          return new Response(
            JSON.stringify({ user_id: userId, nickname: 'test_nickname', profile_img: null }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }
        if (url.includes(`users/${userId}/profile`) && method === 'GET') {
          throw new TypeError('Failed to fetch')
        }
        return orig(input, init)
      }
    }, MOCK_USER_ID)

    await page.goto('/mypage')
    await expect(page.getByText('프로필을 불러올 수 없습니다.')).toBeVisible({ timeout: 8_000 })
  })

  test('프로필 API 에러 시 탭이 렌더되지 않는다', async ({ page }) => {
    await buildAuthStubWithProfileError(page, 500)
    await page.goto('/mypage')
    await expect(page.getByText('프로필을 불러올 수 없습니다.')).toBeVisible({ timeout: 8_000 })
    await expect(page.getByRole('tab', { name: /게시글/ })).not.toBeVisible()
  })
})

// ─── 좋아요 에러 ──────────────────────────────────────────────────────────────

test.describe('좋아요 API 에러 (optimistic rollback)', () => {
  test('POST /posts/:id/like 500 → 카운트가 원래 값으로 롤백된다', async ({ page }) => {
    await setupMyPageWithModal(page, {
      postDetail: { ...MOCK_POST_DETAIL, is_liked: false, like_count: 7 },
    })
    await openFirstPostModal(page)

    await page.evaluate(() => {
      const orig = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : String(input)
        const method = input instanceof Request ? input.method : (init?.method ?? 'GET')
        if (url.match(/posts\/[^/]+\/like$/) && method === 'POST') {
          return new Response(
            JSON.stringify({ error_detail: '서버 오류' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          )
        }
        return orig(input, init)
      }
    })

    await page.getByTestId('modal-like-button').click()
    // optimistic(8) 후 롤백(7)
    await expect(page.getByTestId('modal-like-count')).toHaveText('7', { timeout: 5_000 })
  })

  test('DELETE /posts/:id/like 500 → 카운트가 원래 값으로 롤백된다', async ({ page }) => {
    await setupMyPageWithModal(page, {
      postDetail: { ...MOCK_POST_DETAIL, is_liked: true, like_count: 7 },
    })
    await openFirstPostModal(page)

    await page.evaluate(() => {
      const orig = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : String(input)
        const method = input instanceof Request ? input.method : (init?.method ?? 'GET')
        if (url.match(/posts\/[^/]+\/like$/) && method === 'DELETE') {
          return new Response(
            JSON.stringify({ error_detail: '서버 오류' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          )
        }
        return orig(input, init)
      }
    })

    await page.getByTestId('modal-like-button').click()
    // optimistic(6) 후 롤백(7)
    await expect(page.getByTestId('modal-like-count')).toHaveText('7', { timeout: 5_000 })
  })
})

// ─── 북마크 에러 ──────────────────────────────────────────────────────────────

test.describe('북마크 API 에러 (optimistic rollback)', () => {
  test('POST /posts/:id/bookmark 500 → 북마크 상태가 롤백된다', async ({ page }) => {
    await setupMyPageWithModal(page, {
      postDetail: { ...MOCK_POST_DETAIL, is_bookmarked: false },
    })
    await openFirstPostModal(page)

    await page.evaluate(() => {
      const orig = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : String(input)
        const method = input instanceof Request ? input.method : (init?.method ?? 'GET')
        if (url.match(/posts\/[^/]+\/bookmark$/) && method === 'POST') {
          return new Response(
            JSON.stringify({ error_detail: '서버 오류' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          )
        }
        return orig(input, init)
      }
    })

    const bookmarkButton = page.getByTestId('modal-bookmark-button')
    await bookmarkButton.click()
    // 롤백 후 비활성(text-disabled) 상태 복원
    await expect(bookmarkButton.locator('svg')).toHaveClass(/text-text-disabled/, { timeout: 5_000 })
  })

  test('DELETE /posts/:id/bookmark 500 → 북마크 해제가 롤백되어 활성 상태 유지', async ({ page }) => {
    await setupMyPageWithModal(page, {
      postDetail: { ...MOCK_POST_DETAIL, is_bookmarked: true },
    })
    await openFirstPostModal(page)

    await page.evaluate(() => {
      const orig = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : String(input)
        const method = input instanceof Request ? input.method : (init?.method ?? 'GET')
        if (url.match(/posts\/[^/]+\/bookmark$/) && method === 'DELETE') {
          return new Response(
            JSON.stringify({ error_detail: '서버 오류' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          )
        }
        return orig(input, init)
      }
    })

    const bookmarkButton = page.getByTestId('modal-bookmark-button')
    await bookmarkButton.click()
    // 롤백 후 활성(text-primary) 상태 복원
    await expect(bookmarkButton.locator('svg')).toHaveClass(/text-primary/, { timeout: 5_000 })
  })
})

// ─── 댓글 에러 ───────────────────────────────────────────────────────────────

test.describe('댓글 API 에러', () => {
  test('POST /comments 실패 시 에러 토스트가 표시되고 입력란이 초기화되지 않는다', async ({ page }) => {
    await setupMyPageWithModal(page)
    await openFirstPostModal(page)

    await page.evaluate(() => {
      const orig = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : String(input)
        const method = input instanceof Request ? input.method : (init?.method ?? 'GET')
        if (url.includes('/comments') && method === 'POST') {
          return new Response(
            JSON.stringify({ error_detail: '댓글 작성에 실패했습니다.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          )
        }
        return orig(input, init)
      }
    })

    const input = page.getByTestId('post-modal').getByPlaceholder('댓글을 입력하세요...')
    await input.fill('실패해야 하는 댓글')
    await page.getByTestId('post-modal').getByRole('button', { name: '전송' }).click()

    await expect(page.getByRole('status')).toBeVisible({ timeout: 5_000 })
    // onError 후 입력란 상태 — 실패 시 초기화 안 됨
    // (onSuccess에서만 setComment('') 호출)
    await expect(input).not.toHaveValue('')
  })

  test('GET /comments 실패 시 댓글 섹션이 없어도 앱이 크래시되지 않는다', async ({ page }) => {
    await page.addInitScript((args: { userId: string; profile: string; postDetail: string }) => {
      const profileData = JSON.parse(args.profile)
      const postDetailData = JSON.parse(args.postDetail)
      const orig = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : String(input)
        const method = input instanceof Request ? input.method : (init?.method ?? 'GET')
        if (url.includes('users/token/refresh') && method === 'POST') {
          return new Response(
            JSON.stringify({ access_token: 'mock_access_token' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }
        if (url.includes('users/me') && method === 'GET') {
          return new Response(
            JSON.stringify({ user_id: args.userId, nickname: profileData.nickname, profile_img: null }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }
        if (url.includes(`users/${args.userId}/profile`) && method === 'GET') {
          return new Response(JSON.stringify(profileData), {
            status: 200, headers: { 'Content-Type': 'application/json' },
          })
        }
        if (url.match(/\/posts\/[^/]+$/) && method === 'GET') {
          return new Response(JSON.stringify(postDetailData), {
            status: 200, headers: { 'Content-Type': 'application/json' },
          })
        }
        if (url.includes('/comments') && method === 'GET') {
          return new Response(
            JSON.stringify({ error_detail: '댓글을 불러올 수 없습니다.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          )
        }
        return orig(input, init)
      }
    }, {
      userId: MOCK_USER_ID,
      profile: JSON.stringify(MOCK_PROFILE),
      postDetail: JSON.stringify(MOCK_POST_DETAIL),
    })

    await page.goto('/mypage')
    await expect(page.locator(`h2:has-text("${MOCK_PROFILE.nickname}")`)).toBeVisible({ timeout: 10_000 })
    await page.locator('[data-post-id]').first().click()

    // 모달이 열리고 크래시 없이 닫기 버튼이 표시된다
    await expect(page.getByRole('button', { name: '닫기' })).toBeVisible({ timeout: 8_000 })
  })
})

// ─── 이미지 업로드 에러 (댓글) ──────────────────────────────────────────────

test.describe('댓글 이미지 업로드 에러', () => {
  test.beforeEach(async ({ page }) => {
    await setupMyPageWithModal(page)
    await openFirstPostModal(page)
  })

  test('presigned-url API 실패 시 에러 토스트가 표시된다', async ({ page }) => {
    await page.evaluate(() => {
      const orig = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : String(input)
        const method = input instanceof Request ? input.method : (init?.method ?? 'GET')
        if (url.includes('presigned-url') && method === 'POST') {
          return new Response(
            JSON.stringify({ error_detail: 'presigned URL 발급 실패' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          )
        }
        return orig(input, init)
      }
    })

    await page.getByTestId('post-modal').locator('input[type="file"]').setInputFiles({
      name: 'photo.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
    })

    // 파일 선택 후 미리보기가 생길 때까지 대기하고 전송 버튼 클릭
    await page.getByTestId('post-modal').getByRole('button', { name: '전송' }).click()
    await expect(page.getByRole('status')).toBeVisible({ timeout: 8_000 })
  })
})
