/**
 * 팔로워/팔로잉 페이지 E2E 테스트
 *
 * MSW mockFollowers (4명):
 *   - traveler_kim  (other-user-1)  is_following: false → "팔로우" 버튼
 *   - yh_explorer   (other-user-2)  is_following: true  → "팔로잉" 버튼 + 맞팔
 *   - jeju_lover    (follower-3)    is_following: false → "팔로우" 버튼
 *   - road_tripper  (follower-4)    is_following: true  → "팔로잉" 버튼
 *
 * MSW mockFollowings (3명, 모두 is_following: true):
 *   - yh_explorer   (other-user-2) → 맞팔
 *   - alps_hiker    (following-1)
 *   - seoul_wanderer (following-2)
 */

import { test, expect } from '@playwright/test'
import { setupAuthenticatedFollowers, stubFollowApiFailure } from './helpers'

// ─────────────────────────────────────────────
// 팔로워 탭 — 렌더링
// ─────────────────────────────────────────────

test.describe('팔로워 탭 — 렌더링', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedFollowers(page, 'followers')
  })

  test('팔로워 4명이 목록에 표시된다', async ({ page }) => {
    await expect(page.getByText('traveler_kim')).toBeVisible()
    await expect(page.getByText('yh_explorer')).toBeVisible()
    await expect(page.getByText('jeju_lover')).toBeVisible()
    await expect(page.getByText('road_tripper')).toBeVisible()
  })

  test('팔로우하지 않은 유저에게는 "팔로우" 버튼이 표시된다', async ({ page }) => {
    const row = page.locator('li').filter({ hasText: 'traveler_kim' })
    await expect(row.getByRole('button', { name: '팔로우' })).toBeVisible()
  })

  test('이미 팔로우 중인 유저에게는 "팔로잉" 버튼이 표시된다', async ({ page }) => {
    const row = page.locator('li').filter({ hasText: 'yh_explorer' })
    await expect(row.getByRole('button', { name: '팔로잉' })).toBeVisible()
  })

  test('맞팔 유저에게는 "맞팔" 배지가 표시된다', async ({ page }) => {
    // yh_explorer 는 mockFollowers 와 mockFollowings 양쪽에 있어 맞팔
    const row = page.locator('li').filter({ hasText: 'yh_explorer' })
    await expect(row.getByText('맞팔')).toBeVisible()
  })

  test('맞팔이 아닌 유저에게는 "맞팔" 배지가 없다', async ({ page }) => {
    const row = page.locator('li').filter({ hasText: 'traveler_kim' })
    await expect(row.getByText('맞팔')).not.toBeVisible()
  })
})

// ─────────────────────────────────────────────
// 팔로잉 탭 — 렌더링
// ─────────────────────────────────────────────

test.describe('팔로잉 탭 — 렌더링', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedFollowers(page, 'following')
  })

  test('팔로잉 3명이 목록에 표시된다', async ({ page }) => {
    await expect(page.getByText('yh_explorer')).toBeVisible()
    await expect(page.getByText('alps_hiker')).toBeVisible()
    await expect(page.getByText('seoul_wanderer')).toBeVisible()
  })

  test('팔로잉 목록의 모든 유저에게 "팔로잉" 버튼이 표시된다', async ({ page }) => {
    for (const nickname of ['yh_explorer', 'alps_hiker', 'seoul_wanderer']) {
      const row = page.locator('li').filter({ hasText: nickname })
      await expect(row.getByRole('button', { name: '팔로잉' })).toBeVisible()
    }
  })

  test('팔로잉 탭에서도 맞팔 유저에게 "맞팔" 배지가 표시된다', async ({ page }) => {
    // yh_explorer 는 mockFollowers 에도 있어 맞팔
    const row = page.locator('li').filter({ hasText: 'yh_explorer' })
    await expect(row.getByText('맞팔')).toBeVisible()
  })
})

// ─────────────────────────────────────────────
// 팔로우 토글 — 성공
// ─────────────────────────────────────────────

test.describe('팔로우 토글 — 성공', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedFollowers(page, 'followers')
  })

  test('미팔로우 유저의 "팔로우" 클릭 시 "팔로잉"으로 즉시 변경된다', async ({ page }) => {
    const row = page.locator('li').filter({ hasText: 'traveler_kim' })

    await row.getByRole('button', { name: '팔로우' }).click()

    // 낙관적 업데이트 — API 응답 전에 UI 즉시 반영
    await expect(row.getByRole('button', { name: '팔로잉' })).toBeVisible()
  })

  test('"팔로잉" 클릭 시 "팔로우"로 즉시 변경된다 (언팔로우)', async ({ page }) => {
    const row = page.locator('li').filter({ hasText: 'road_tripper' })

    await row.getByRole('button', { name: '팔로잉' }).click()

    await expect(row.getByRole('button', { name: '팔로우' })).toBeVisible()
  })

  test('팔로우 성공 후 서버 데이터와 동기화된다', async ({ page }) => {
    const row = page.locator('li').filter({ hasText: 'traveler_kim' })
    await row.getByRole('button', { name: '팔로우' }).click()

    // onSettled → invalidateBoth → 서버 재조회 이후에도 팔로잉 상태 유지
    await expect(row.getByRole('button', { name: '팔로잉' })).toBeVisible()
    await expect(row.getByRole('button', { name: '팔로우' })).not.toBeVisible()
  })

  test('언팔로우 성공 후 서버 데이터와 동기화된다', async ({ page }) => {
    const row = page.locator('li').filter({ hasText: 'road_tripper' })
    await row.getByRole('button', { name: '팔로잉' }).click()

    await expect(row.getByRole('button', { name: '팔로우' })).toBeVisible()
    await expect(row.getByRole('button', { name: '팔로잉' })).not.toBeVisible()
  })
})

// ─────────────────────────────────────────────
// 팔로우 토글 — 실패 및 롤백
// ─────────────────────────────────────────────

test.describe('팔로우 토글 — 실패 및 롤백', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedFollowers(page, 'followers')
  })

  test('팔로우 API 실패 시 에러 토스트가 표시된다', async ({ page }) => {
    await stubFollowApiFailure(page, 'POST')

    const row = page.locator('li').filter({ hasText: 'traveler_kim' })
    await row.getByRole('button', { name: '팔로우' }).click()

    await expect(
      page.getByRole('status').filter({ hasText: '팔로우 변경에 실패했습니다.' }),
    ).toBeVisible()
  })

  test('팔로우 API 실패 시 버튼이 "팔로우"로 롤백된다', async ({ page }) => {
    await stubFollowApiFailure(page, 'POST')

    const row = page.locator('li').filter({ hasText: 'traveler_kim' })
    await row.getByRole('button', { name: '팔로우' }).click()

    // 에러 응답 수신 후 onError 롤백 → 원래 상태 복원
    await expect(
      page.getByRole('status').filter({ hasText: '팔로우 변경에 실패했습니다.' }),
    ).toBeVisible()
    await expect(row.getByRole('button', { name: '팔로우' })).toBeVisible()
    await expect(row.getByRole('button', { name: '팔로잉' })).not.toBeVisible()
  })

  test('언팔로우 API 실패 시 에러 토스트가 표시된다', async ({ page }) => {
    await stubFollowApiFailure(page, 'DELETE')

    const row = page.locator('li').filter({ hasText: 'road_tripper' })
    await row.getByRole('button', { name: '팔로잉' }).click()

    await expect(
      page.getByRole('status').filter({ hasText: '팔로우 변경에 실패했습니다.' }),
    ).toBeVisible()
  })

  test('언팔로우 API 실패 시 버튼이 "팔로잉"으로 롤백된다', async ({ page }) => {
    await stubFollowApiFailure(page, 'DELETE')

    const row = page.locator('li').filter({ hasText: 'road_tripper' })
    await row.getByRole('button', { name: '팔로잉' }).click()

    await expect(
      page.getByRole('status').filter({ hasText: '팔로우 변경에 실패했습니다.' }),
    ).toBeVisible()
    await expect(row.getByRole('button', { name: '팔로잉' })).toBeVisible()
    await expect(row.getByRole('button', { name: '팔로우' })).not.toBeVisible()
  })
})

// ─────────────────────────────────────────────
// 팔로잉 탭 — 언팔로우 UI 갱신
// ─────────────────────────────────────────────

test.describe('팔로잉 탭 — 언팔로우 UI 갱신', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedFollowers(page, 'following')
  })

  test('언팔로우 시 해당 유저가 목록에서 즉시 제거된다', async ({ page }) => {
    await expect(page.getByText('alps_hiker')).toBeVisible()

    const row = page.locator('li').filter({ hasText: 'alps_hiker' })
    await row.getByRole('button', { name: '팔로잉' }).click()

    // is_following=false → following.filter(u => u.is_following) 에서 제외 → 즉시 사라짐
    await expect(page.getByText('alps_hiker')).not.toBeVisible()
  })

  test('언팔로우 후 나머지 유저는 목록에 유지된다', async ({ page }) => {
    const row = page.locator('li').filter({ hasText: 'alps_hiker' })
    await row.getByRole('button', { name: '팔로잉' }).click()

    await expect(page.getByText('yh_explorer')).toBeVisible()
    await expect(page.getByText('seoul_wanderer')).toBeVisible()
  })

  test('언팔로우 API 실패 시 목록에서 제거되지 않는다 (롤백)', async ({ page }) => {
    await stubFollowApiFailure(page, 'DELETE')

    const row = page.locator('li').filter({ hasText: 'alps_hiker' })
    await row.getByRole('button', { name: '팔로잉' }).click()

    // 에러 후 롤백 → is_following=true 복원 → 목록에 재표시
    await expect(
      page.getByRole('status').filter({ hasText: '팔로우 변경에 실패했습니다.' }),
    ).toBeVisible()
    await expect(page.getByText('alps_hiker')).toBeVisible()
  })
})

// ─────────────────────────────────────────────
// 탭 전환
// ─────────────────────────────────────────────

test.describe('탭 전환', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedFollowers(page, 'followers')
  })

  test('팔로워 탭에서 팔로잉 탭으로 전환하면 팔로잉 목록이 표시된다', async ({ page }) => {
    // 팔로워 탭 확인
    await expect(page.getByText('traveler_kim')).toBeVisible()

    // URL 쿼리를 직접 변경해 탭 전환
    await page.goto('/followers?tab=following')
    await expect(page.getByText('alps_hiker')).toBeVisible()

    // 팔로워 전용 항목은 사라진다
    await expect(page.getByText('traveler_kim')).not.toBeVisible()
  })

  test('팔로잉 탭에서 팔로워 탭으로 전환하면 팔로워 목록이 표시된다', async ({ page }) => {
    await page.goto('/followers?tab=following')
    await expect(page.getByText('alps_hiker')).toBeVisible()

    await page.goto('/followers')
    await expect(page.getByText('traveler_kim')).toBeVisible()
    await expect(page.getByText('alps_hiker')).not.toBeVisible()
  })
})
