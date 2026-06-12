/**
 * 마이페이지 — 탭(게시글/저장됨) E2E 테스트
 *
 * 검증 항목:
 *  - 기본 탭은 "게시글"
 *  - 게시글 탭: 게시글 수 카운트 표시, 썸네일 그리드 렌더
 *  - 게시글 탭: 게시글 0개일 때 EmptyState 표시
 *  - 저장됨 탭: "준비 중입니다" EmptyState 표시
 *  - 탭 전환 시 콘텐츠 전환
 *  - 탭 카운트 배지 표시
 */

import { test, expect } from '@playwright/test'
import { setupMyPage, MOCK_PROFILE } from './helpers'

// ─── 기본 탭 상태 ────────────────────────────────────────────────────────────

test.describe('탭 기본 상태', () => {
  test.beforeEach(async ({ page }) => {
    await setupMyPage(page)
  })

  test('"게시글" 탭이 기본 선택되어 있다', async ({ page }) => {
    const postsTab = page.getByRole('tab', { name: /게시글/ })
    await expect(postsTab).toBeVisible()
    await expect(postsTab).toHaveAttribute('aria-selected', 'true')
  })

  test('"저장됨" 탭이 표시된다', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /저장됨/ })).toBeVisible()
  })

  test('"게시글" 탭에 게시글 수 카운트가 표시된다', async ({ page }) => {
    // MOCK_PROFILE.posts_count = 3
    await expect(page.getByRole('tab', { name: /게시글.*3/ })).toBeVisible()
  })
})

// ─── 게시글 탭 콘텐츠 ────────────────────────────────────────────────────────

test.describe('게시글 탭 콘텐츠', () => {
  test.beforeEach(async ({ page }) => {
    await setupMyPage(page)
  })

  test('게시글 썸네일 이미지가 모두 렌더된다', async ({ page }) => {
    const thumbnails = page.locator('[data-post-id] img')
    await expect(thumbnails).toHaveCount(MOCK_PROFILE.posts.length)
  })

  test('각 썸네일에 alt 텍스트(제목)가 설정된다', async ({ page }) => {
    for (const post of MOCK_PROFILE.posts) {
      await expect(page.locator(`img[alt="${post.title}"]`)).toBeVisible()
    }
  })

  test('data-post-id 속성으로 게시글이 식별된다', async ({ page }) => {
    for (const post of MOCK_PROFILE.posts) {
      await expect(page.locator(`[data-post-id="${post.post_id}"]`)).toBeVisible()
    }
  })
})

// ─── 게시글 0개 EmptyState ──────────────────────────────────────────────────

test.describe('게시글 없음 상태', () => {
  test('게시글이 0개이면 EmptyState가 표시된다', async ({ page }) => {
    await setupMyPage(page, {
      profile: { ...MOCK_PROFILE, posts_count: 0, posts: [] },
    })
    await expect(page.getByText('아직 작성한 게시글이 없어요')).toBeVisible()
    await expect(page.getByText('첫 여행 기록을 작성해보세요.')).toBeVisible()
  })

  test('게시글이 0개일 때 썸네일 그리드가 렌더되지 않는다', async ({ page }) => {
    await setupMyPage(page, {
      profile: { ...MOCK_PROFILE, posts_count: 0, posts: [] },
    })
    await expect(page.locator('[data-post-id]')).toHaveCount(0)
  })
})

// ─── 저장됨 탭 ───────────────────────────────────────────────────────────────

test.describe('저장됨 탭', () => {
  test.beforeEach(async ({ page }) => {
    await setupMyPage(page)
  })

  test('"저장됨" 탭 클릭 시 "준비 중입니다" 안내가 표시된다', async ({ page }) => {
    await page.getByRole('tab', { name: /저장됨/ }).click()
    await expect(page.getByText('준비 중입니다')).toBeVisible()
  })

  test('"저장됨" 탭 클릭 시 게시글 그리드가 사라진다', async ({ page }) => {
    await page.getByRole('tab', { name: /저장됨/ }).click()
    await expect(page.locator('[data-post-id]')).toHaveCount(0)
  })

  test('"게시글" 탭으로 돌아오면 썸네일 그리드가 다시 표시된다', async ({ page }) => {
    await page.getByRole('tab', { name: /저장됨/ }).click()
    await page.getByRole('tab', { name: /게시글/ }).click()
    await expect(page.locator('[data-post-id]').first()).toBeVisible()
  })
})

// ─── 탭 전환 시 탭 선택 상태 ────────────────────────────────────────────────

test.describe('탭 선택 상태 전환', () => {
  test.beforeEach(async ({ page }) => {
    await setupMyPage(page)
  })

  test('"저장됨" 클릭 시 해당 탭이 selected 상태가 된다', async ({ page }) => {
    await page.getByRole('tab', { name: /저장됨/ }).click()
    await expect(page.getByRole('tab', { name: /저장됨/ })).toHaveAttribute('aria-selected', 'true')
  })

  test('"저장됨" 선택 후 "게시글" 클릭 시 게시글 탭이 selected 상태가 된다', async ({ page }) => {
    await page.getByRole('tab', { name: /저장됨/ }).click()
    await page.getByRole('tab', { name: /게시글/ }).click()
    await expect(page.getByRole('tab', { name: /게시글/ })).toHaveAttribute('aria-selected', 'true')
  })
})
