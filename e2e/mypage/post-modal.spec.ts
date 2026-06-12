/**
 * 마이페이지 — PostModal 상호작용 E2E 테스트
 *
 * 검증 항목:
 *  [모달 열기]
 *  - 썸네일 클릭 → PostModal 열림
 *  - 게시글 상세 정보(닉네임, 장소명) 표시
 *  - 댓글 목록 표시
 *
 *  [모달 닫기]
 *  - "닫기(X)" 버튼 클릭
 *  - Escape 키
 *  - 백드롭 클릭
 *
 *  [좋아요]
 *  - 좋아요 버튼 클릭 → 카운트 증가
 *  - 좋아요 취소 → 카운트 감소
 *  - API 실패 시 optimistic update 롤백
 *
 *  [북마크]
 *  - 북마크 클릭 → 아이콘 토글
 *  - 북마크 취소
 *  - API 실패 시 롤백
 *
 *  [댓글]
 *  - 댓글 입력란 표시
 *  - 빈 내용으로 전송 불가
 *  - 댓글 입력 후 전송 성공 → 입력란 초기화
 *  - 엔터키로 전송
 *  - 댓글 작성 API 실패 시 에러 토스트
 *
 *  [코스 상세보기]
 *  - "코스 상세보기" 버튼 클릭 → /?solo=postId 이동
 *  - sessionStorage에 scrollToPostId 저장됨
 *
 *  [게시글 삭제 - 오너]
 *  - 케밥 메뉴 → "삭제하기" 표시
 *
 *  [PostModal API 실패]
 *  - GET /posts/:postId 실패 시 모달 닫힘 + 에러 토스트
 */

import { test, expect } from '@playwright/test'
import {
  setupMyPageWithModal,
  openFirstPostModal,
  MOCK_POST_DETAIL,
  MOCK_PROFILE,
  MOCK_POST_ID,
  MOCK_COMMENTS,
} from './helpers'

// ─── 모달 열기 ───────────────────────────────────────────────────────────────

test.describe('PostModal 열기', () => {
  test.beforeEach(async ({ page }) => {
    await setupMyPageWithModal(page)
  })

  test('게시글 썸네일 클릭 시 PostModal이 열린다', async ({ page }) => {
    await openFirstPostModal(page)
    await expect(page.getByTestId('post-modal')).toBeVisible()
  })

  test('모달에 게시자 닉네임이 표시된다', async ({ page }) => {
    await openFirstPostModal(page)
    // 모달 header에 닉네임이 표시된다 (댓글 작성자 닉네임과 구분하기 위해 header로 스코핑)
    await expect(
      page.getByTestId('post-modal').locator('header').getByText(MOCK_POST_DETAIL.user.nickname),
    ).toBeVisible()
  })

  test('모달에 첫 번째 스팟 장소명이 표시된다', async ({ page }) => {
    await openFirstPostModal(page)
    // ImagePane의 핀 레이블과 DetailPane의 장소명 두 군데에 표시되므로 first()로 하나만 검증
    await expect(
      page.getByTestId('post-modal').getByText(MOCK_POST_DETAIL.spots[0].location.place_name).first(),
    ).toBeVisible()
  })

  test('모달에 댓글이 표시된다', async ({ page }) => {
    await openFirstPostModal(page)
    for (const comment of MOCK_COMMENTS.results) {
      await expect(page.getByTestId('post-modal').getByText(comment.content!)).toBeVisible()
    }
  })

  test('모달에 좋아요 카운트가 표시된다', async ({ page }) => {
    await openFirstPostModal(page)
    await expect(page.getByTestId('modal-like-count')).toHaveText(String(MOCK_POST_DETAIL.like_count))
  })

  test('두 번째 썸네일 클릭 시 해당 게시글 모달이 열린다', async ({ page }) => {
    // 두 번째 post(post-002) detail도 스텁에서 /posts/post-002로 매칭
    await page.locator('[data-post-id="post-002"]').click()
    await expect(page.getByTestId('post-modal')).toBeVisible({ timeout: 8_000 })
  })
})

// ─── 모달 닫기 ───────────────────────────────────────────────────────────────

test.describe('PostModal 닫기', () => {
  test.beforeEach(async ({ page }) => {
    await setupMyPageWithModal(page)
    await openFirstPostModal(page)
  })

  test('"닫기(X)" 버튼 클릭 시 모달이 닫힌다', async ({ page }) => {
    await page.getByRole('button', { name: '닫기' }).click()
    await expect(page.getByTestId('post-modal')).not.toBeVisible()
  })

  test('Escape 키 입력 시 모달이 닫힌다', async ({ page }) => {
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('post-modal')).not.toBeVisible()
  })

  test('백드롭(모달 바깥 영역) 클릭 시 모달이 닫힌다', async ({ page }) => {
    await page.getByTestId('post-modal-backdrop').click({ position: { x: 5, y: 5 } })
    await expect(page.getByTestId('post-modal')).not.toBeVisible()
  })

  test('모달 내부 클릭 시 닫히지 않는다', async ({ page }) => {
    await page.getByTestId('post-modal').click()
    await expect(page.getByTestId('post-modal')).toBeVisible()
  })
})

// ─── 좋아요 ──────────────────────────────────────────────────────────────────

test.describe('좋아요', () => {
  test.beforeEach(async ({ page }) => {
    await setupMyPageWithModal(page, {
      postDetail: { ...MOCK_POST_DETAIL, is_liked: false, like_count: 5 },
    })
    await openFirstPostModal(page)
  })

  test('좋아요 버튼 클릭 시 카운트가 optimistically 증가한다', async ({ page }) => {
    await page.getByTestId('modal-like-button').click()
    // optimistic update로 즉시 6 표시
    await expect(page.getByTestId('modal-like-count')).toHaveText('6')
  })

  test('좋아요 후 API 성공 시 서버 값(6)이 반영된다', async ({ page }) => {
    await page.getByTestId('modal-like-button').click()
    await expect(page.getByTestId('modal-like-count')).toHaveText('6', { timeout: 5_000 })
  })

  test('좋아요 API 실패 시 카운트가 원래 값(5)으로 롤백된다', async ({ page }) => {
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
    // optimistic(6) 후 롤백되어 5로 복원
    await expect(page.getByTestId('modal-like-count')).toHaveText('5', { timeout: 5_000 })
  })
})

// ─── 좋아요 (이미 좋아요한 상태) ─────────────────────────────────────────────

test.describe('좋아요 취소', () => {
  test.beforeEach(async ({ page }) => {
    await setupMyPageWithModal(page, {
      postDetail: { ...MOCK_POST_DETAIL, is_liked: true, like_count: 5 },
    })
    await openFirstPostModal(page)
  })

  test('이미 좋아요한 상태에서 클릭 시 카운트가 감소한다', async ({ page }) => {
    await page.getByTestId('modal-like-button').click()
    await expect(page.getByTestId('modal-like-count')).toHaveText('4', { timeout: 5_000 })
  })
})

// ─── 북마크 ──────────────────────────────────────────────────────────────────

test.describe('북마크', () => {
  test.beforeEach(async ({ page }) => {
    await setupMyPageWithModal(page, {
      postDetail: { ...MOCK_POST_DETAIL, is_bookmarked: false },
    })
    await openFirstPostModal(page)
  })

  test('북마크 버튼이 표시된다', async ({ page }) => {
    const bookmarkButton = page.getByTestId('modal-bookmark-button')
    await expect(bookmarkButton).toBeVisible()
  })

  test('북마크 클릭 후 API 성공 시 북마크 상태가 활성화된다', async ({ page }) => {
    const bookmarkButton = page.getByTestId('modal-bookmark-button')
    await bookmarkButton.click()
    // is_bookmarked=true가 되면 아이콘 색이 primary로 변경됨
    await expect(bookmarkButton.locator('svg')).toHaveClass(/text-primary/, { timeout: 5_000 })
  })

  test('북마크 API 실패 시 롤백되어 비활성 상태로 유지된다', async ({ page }) => {
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
    await expect(bookmarkButton.locator('svg')).toHaveClass(/text-text-disabled/, { timeout: 5_000 })
  })
})

// ─── 댓글 ────────────────────────────────────────────────────────────────────

test.describe('댓글 입력', () => {
  test.beforeEach(async ({ page }) => {
    await setupMyPageWithModal(page)
    await openFirstPostModal(page)
  })

  test('댓글 입력란이 표시된다', async ({ page }) => {
    await expect(
      page.getByTestId('post-modal').getByPlaceholder('댓글을 입력하세요...'),
    ).toBeVisible()
  })

  test('"전송" 버튼이 표시된다', async ({ page }) => {
    await expect(
      page.getByTestId('post-modal').getByRole('button', { name: '전송' }),
    ).toBeVisible()
  })

  test('댓글이 비어 있으면 "전송" 버튼이 비활성화된다', async ({ page }) => {
    await expect(
      page.getByTestId('post-modal').getByRole('button', { name: '전송' }),
    ).toBeDisabled()
  })

  test('댓글 입력 시 "전송" 버튼이 활성화된다', async ({ page }) => {
    await page.getByTestId('post-modal').getByPlaceholder('댓글을 입력하세요...').fill('테스트 댓글')
    await expect(
      page.getByTestId('post-modal').getByRole('button', { name: '전송' }),
    ).toBeEnabled()
  })

  test('공백만 입력 시 "전송" 버튼이 비활성화 상태를 유지한다', async ({ page }) => {
    await page.getByTestId('post-modal').getByPlaceholder('댓글을 입력하세요...').fill('   ')
    await expect(
      page.getByTestId('post-modal').getByRole('button', { name: '전송' }),
    ).toBeDisabled()
  })

  test('댓글 전송 성공 후 입력란이 초기화된다', async ({ page }) => {
    const input = page.getByTestId('post-modal').getByPlaceholder('댓글을 입력하세요...')
    await input.fill('새로운 댓글입니다')
    await page.getByTestId('post-modal').getByRole('button', { name: '전송' }).click()
    await expect(input).toHaveValue('', { timeout: 5_000 })
  })

  test('Enter 키로 댓글을 전송할 수 있다', async ({ page }) => {
    const input = page.getByTestId('post-modal').getByPlaceholder('댓글을 입력하세요...')
    await input.fill('엔터 전송 테스트')
    await input.press('Enter')
    await expect(input).toHaveValue('', { timeout: 5_000 })
  })

  test('한글 IME 조합 중 Enter는 전송되지 않는다', async ({ page }) => {
    // isComposing=true 상태에서 Enter를 시뮬레이션하기 위해
    // 입력 후 바로 조합 종료 없이 Enter를 누르는 방식은 브라우저가 처리.
    // 여기서는 CompositionStart 이후 Enter가 무시되는지 확인.
    const input = page.getByTestId('post-modal').getByPlaceholder('댓글을 입력하세요...')
    await input.fill('댓글')
    // dispatchEvent로 isComposing=true인 keydown 이벤트 전송
    await page.evaluate(() => {
      const el = document.querySelector('input[placeholder="댓글을 입력하세요..."]')
      if (!el) return
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true }))
    })
    // 입력란이 초기화되지 않아야 한다
    await expect(input).toHaveValue('댓글')
  })

  test('댓글 작성 API 실패 시 에러 토스트가 표시된다', async ({ page }) => {
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
    await page.getByTestId('post-modal').getByPlaceholder('댓글을 입력하세요...').fill('실패 댓글')
    await page.getByTestId('post-modal').getByRole('button', { name: '전송' }).click()
    await expect(page.getByRole('status')).toBeVisible({ timeout: 5_000 })
  })
})

// ─── 이미지 첨부 버튼 ────────────────────────────────────────────────────────

test.describe('댓글 이미지 첨부', () => {
  test.beforeEach(async ({ page }) => {
    await setupMyPageWithModal(page)
    await openFirstPostModal(page)
  })

  test('"이미지 첨부" 버튼(+ 아이콘)이 표시된다', async ({ page }) => {
    await expect(
      page.getByTestId('post-modal').getByRole('button', { name: '이미지 첨부' }),
    ).toBeVisible()
  })

  test('허용되지 않는 파일 형식을 첨부하면 에러 토스트가 표시된다', async ({ page }) => {
    // GIF 등 ALLOWED_IMAGE_TYPES에 없는 형식
    await page.getByTestId('post-modal').locator('input[type="file"]').setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('hello'),
    })
    await expect(page.getByRole('status')).toBeVisible({ timeout: 5_000 })
  })

  test('5MB 초과 이미지를 첨부하면 에러 토스트가 표시된다', async ({ page }) => {
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024, 0xff)
    await page.getByTestId('post-modal').locator('input[type="file"]').setInputFiles({
      name: 'large.jpg',
      mimeType: 'image/jpeg',
      buffer: largeBuffer,
    })
    await expect(page.getByRole('status')).toBeVisible({ timeout: 5_000 })
  })
})

// ─── 코스 상세보기 (solo 모드 이동) ─────────────────────────────────────────

test.describe('코스 상세보기 (solo 이동)', () => {
  test.beforeEach(async ({ page }) => {
    await setupMyPageWithModal(page)
    await openFirstPostModal(page)
  })

  test('"코스 상세보기" 버튼이 표시된다', async ({ page }) => {
    await expect(
      page.getByTestId('post-modal').getByRole('button', { name: '코스 상세보기' }),
    ).toBeVisible()
  })

  test('"코스 상세보기" 클릭 시 /?solo=postId로 이동한다', async ({ page }) => {
    await page.getByTestId('post-modal').getByRole('button', { name: '코스 상세보기' }).click()
    await expect(page).toHaveURL(new RegExp(`solo=${MOCK_POST_ID}`), { timeout: 5_000 })
  })

  test('"코스 상세보기" 클릭 시 sessionStorage에 scrollToPostId가 저장된다', async ({ page }) => {
    await page.getByTestId('post-modal').getByRole('button', { name: '코스 상세보기' }).click()
    const stored = await page.evaluate(() => sessionStorage.getItem('scrollToPostId'))
    expect(stored).toBe(MOCK_POST_ID)
  })
})

// ─── PostModal API 실패 ──────────────────────────────────────────────────────

test.describe('PostModal API 실패 처리', () => {
  test('GET /posts/:postId 실패 시 에러 토스트가 표시되고 모달이 닫힌다', async ({ page }) => {
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
          return new Response(
            JSON.stringify({
              name: '홍길동',
              nickname: 'test_nickname',
              profile_img: null,
              intro: '',
              follower: 0,
              following: 0,
              is_following: false,
              posts_count: 1,
              posts: [{ post_id: 'post-fail', title: '실패 게시글', thumbnail: 'https://picsum.photos/seed/fail/480/320' }],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }
        // 게시글 상세 API 실패
        if (url.match(/\/posts\/[^/]+$/) && method === 'GET') {
          return new Response(
            JSON.stringify({ error_detail: '게시글을 찾을 수 없습니다.' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } },
          )
        }
        // 댓글은 빈 목록
        if (url.includes('/comments') && method === 'GET') {
          return new Response(
            JSON.stringify({ previous: null, next: null, results: [] }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }
        return orig(input, init)
      }
    }, 'mock-user-id')

    await page.goto('/mypage')
    await expect(page.locator('h2:has-text("test_nickname")')).toBeVisible({ timeout: 10_000 })

    await page.locator('[data-post-id]').first().click()

    // 에러 토스트 표시 + 모달 자동 닫힘
    await expect(page.getByRole('status')).toBeVisible({ timeout: 8_000 })
    await expect(page.getByTestId('post-modal')).not.toBeVisible({ timeout: 8_000 })
  })
})

// ─── 케밥 메뉴 (오너 권한) ───────────────────────────────────────────────────

test.describe('케밥 메뉴', () => {
  test.beforeEach(async ({ page }) => {
    await setupMyPageWithModal(page, {
      postDetail: { ...MOCK_POST_DETAIL, is_owner: true },
    })
    await openFirstPostModal(page)
  })

  test('케밥 메뉴 버튼(더보기)이 표시된다', async ({ page }) => {
    // 댓글 영역에도 "더보기" 버튼이 있으므로 모달 floating 컨트롤 영역으로 스코핑
    await expect(page.getByTestId('post-modal').getByRole('button', { name: '더보기' }).first()).toBeVisible()
  })

  test('케밥 메뉴 클릭 시 "수정하기" 항목이 표시된다', async ({ page }) => {
    await page.getByTestId('post-modal').getByRole('button', { name: '더보기' }).first().click()
    await expect(page.getByText('수정하기')).toBeVisible()
  })

  test('케밥 메뉴 클릭 시 "삭제하기" 항목이 표시된다', async ({ page }) => {
    await page.getByTestId('post-modal').getByRole('button', { name: '더보기' }).first().click()
    await expect(page.getByText('삭제하기')).toBeVisible()
  })

  test('케밥 메뉴 클릭 시 "링크 복사" 항목이 표시된다', async ({ page }) => {
    await page.getByTestId('post-modal').getByRole('button', { name: '더보기' }).first().click()
    await expect(page.getByText('링크 복사')).toBeVisible()
  })
})

test.describe('케밥 메뉴 (비오너)', () => {
  test.beforeEach(async ({ page }) => {
    await setupMyPageWithModal(page, {
      postDetail: { ...MOCK_POST_DETAIL, is_owner: false },
    })
    await openFirstPostModal(page)
  })

  test('오너가 아닐 때 케밥 메뉴에 "수정하기"·"삭제하기"가 표시되지 않는다', async ({ page }) => {
    await page.getByTestId('post-modal').getByRole('button', { name: '더보기' }).first().click()
    await expect(page.getByText('수정하기')).not.toBeVisible()
    await expect(page.getByText('삭제하기')).not.toBeVisible()
  })
})

// ─── 스크롤 복원 ─────────────────────────────────────────────────────────────

test.describe('solo 모드에서 돌아올 때 스크롤 복원', () => {
  test('sessionStorage의 scrollToPostId가 있으면 해당 게시글 위치로 스크롤된다', async ({ page }) => {
    // sessionStorage에 미리 값을 설정한 뒤 /mypage 로드
    await page.addInitScript(() => {
      sessionStorage.setItem('scrollToPostId', 'post-002')
    })

    await setupMyPageWithModal(page)

    // sessionStorage 키가 제거되어야 한다 (한 번만 처리)
    const stored = await page.evaluate(() => sessionStorage.getItem('scrollToPostId'))
    expect(stored).toBeNull()

    // 해당 게시글이 화면에 보인다
    await expect(page.locator('[data-post-id="post-002"]')).toBeInViewport({ timeout: 5_000 })
  })
})
