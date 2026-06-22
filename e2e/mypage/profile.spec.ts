/**
 * 마이페이지 — 프로필 헤더 렌더링 E2E 테스트
 *
 * 검증 항목:
 *  - 닉네임·이름·소개글 표시
 *  - 프로필 이미지 / 아바타 이니셜 fallback
 *  - 팔로워·팔로잉 숫자 포맷 (K/M 변환 포함)
 *  - 팔로워·팔로잉 클릭 시 /followers?tab=... 이동
 *  - 비로그인 상태 (userId 없음) 안내 문구
 *  - 인증 미완료(isHydrated=false) 로딩 스피너
 *  - 프로필 API 실패 시 에러 문구
 */

import { test, expect } from '@playwright/test'
import {
  setupMyPage,
  MOCK_PROFILE,
  MOCK_USER_ID,
} from './helpers'

// ─── 기본 프로필 렌더링 ──────────────────────────────────────────────────────

test.describe('프로필 헤더 렌더링', () => {
  test.beforeEach(async ({ page }) => {
    await setupMyPage(page)
  })

  test('페이지 제목 "내 프로필"이 표시된다', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '내 프로필', level: 1 })).toBeVisible()
  })

  test('닉네임이 표시된다', async ({ page }) => {
    await expect(page.getByRole('heading', { name: MOCK_PROFILE.nickname, level: 2 })).toBeVisible()
  })

  test('실명(name)이 표시된다', async ({ page }) => {
    await expect(page.getByText(MOCK_PROFILE.name)).toBeVisible()
  })

  test('소개글(intro)이 표시된다', async ({ page }) => {
    await expect(page.getByText(MOCK_PROFILE.intro)).toBeVisible()
  })

  test('팔로워 수가 표시된다', async ({ page }) => {
    const followerLink = page.getByRole('link', { name: /팔로워/ })
    await expect(followerLink.getByText(String(MOCK_PROFILE.follower), { exact: true })).toBeVisible()
    await expect(followerLink.getByText('팔로워')).toBeVisible()
  })

  test('팔로잉 수가 표시된다', async ({ page }) => {
    const followingLink = page.getByRole('link', { name: /팔로잉/ })
    await expect(followingLink.getByText(String(MOCK_PROFILE.following), { exact: true })).toBeVisible()
    await expect(followingLink.getByText('팔로잉')).toBeVisible()
  })
})

// ─── 프로필 이미지 ──────────────────────────────────────────────────────────

test.describe('프로필 이미지', () => {
  test('profile_img가 null이면 닉네임 이니셜이 아바타에 표시된다', async ({ page }) => {
    await setupMyPage(page, {
      profile: { ...MOCK_PROFILE, profile_img: null },
    })
    const initial = MOCK_PROFILE.nickname[0].toUpperCase()
    // Avatar 컴포넌트는 이니셜을 div 내 텍스트로 렌더한다
    await expect(page.locator('section').getByText(initial, { exact: true })).toBeVisible()
  })

  test('profile_img URL이 있으면 img 태그가 렌더된다', async ({ page }) => {
    await setupMyPage(page, {
      profile: {
        ...MOCK_PROFILE,
        profile_img: 'https://picsum.photos/seed/avatar/200/200',
      },
    })
    const img = page.locator('section img').first()
    await expect(img).toBeVisible()
    await expect(img).toHaveAttribute('src', /picsum/)
  })
})

// ─── 팔로워/팔로잉 숫자 포맷 ────────────────────────────────────────────────

test.describe('팔로워/팔로잉 숫자 포맷', () => {
  test('1000 미만은 숫자 그대로 표시된다', async ({ page }) => {
    await setupMyPage(page, {
      profile: { ...MOCK_PROFILE, follower: 999, following: 1 },
    })
    await expect(page.getByRole('link', { name: /팔로워/ }).getByText('999', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: /팔로잉/ }).getByText('1', { exact: true })).toBeVisible()
  })

  test('1000 이상은 K 단위로 표시된다', async ({ page }) => {
    await setupMyPage(page, {
      profile: { ...MOCK_PROFILE, follower: 1500, following: 12000 },
    })
    await expect(page.getByText('1.5K')).toBeVisible()
    await expect(page.getByText('12K')).toBeVisible()
  })

  test('1,000,000 이상은 M 단위로 표시된다', async ({ page }) => {
    await setupMyPage(page, {
      profile: { ...MOCK_PROFILE, follower: 2_500_000, following: 0 },
    })
    await expect(page.getByText('2.5M')).toBeVisible()
  })
})

// ─── 팔로워/팔로잉 링크 ──────────────────────────────────────────────────────

test.describe('팔로워·팔로잉 클릭 내비게이션', () => {
  test.beforeEach(async ({ page }) => {
    await setupMyPage(page)
  })

  test('"팔로워" 박스 클릭 시 /followers?tab=followers로 이동한다', async ({ page }) => {
    await page.getByText('팔로워').click()
    await expect(page).toHaveURL(/followers.*tab=followers/)
  })

  test('"팔로잉" 박스 클릭 시 /followers?tab=following으로 이동한다', async ({ page }) => {
    await page.getByText('팔로잉').click()
    await expect(page).toHaveURL(/followers.*tab=following/)
  })
})

// ─── 소개글 없는 프로필 ──────────────────────────────────────────────────────

test.describe('선택적 필드 미표시', () => {
  test('소개글이 없으면 intro 영역이 렌더되지 않는다', async ({ page }) => {
    await setupMyPage(page, {
      profile: { ...MOCK_PROFILE, intro: '' },
    })
    await expect(page.getByText('여행을 좋아하는 사람입니다.')).not.toBeVisible()
  })

  test('name이 없으면 실명 영역이 렌더되지 않는다', async ({ page }) => {
    await setupMyPage(page, {
      profile: { ...MOCK_PROFILE, name: '' },
    })
    await expect(page.getByText('홍길동')).not.toBeVisible()
  })
})

// ─── 비인증 / 로딩 상태 ─────────────────────────────────────────────────────

test.describe('인증 상태별 렌더링', () => {
  // AuthGuard가 비로그인 상태를 감지하면 /login으로 리다이렉트한다.
  // 마이페이지 내부의 "로그인이 필요합니다." 문구는 AuthGuard가 없는 환경에서만 노출된다.

  test('token/refresh 실패 시 /login으로 리다이렉트된다', async ({ page }) => {
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

  test('token/refresh 성공 후 getUserMe 실패 시 "로그인이 필요합니다." 안내가 표시된다', async ({ page }) => {
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
        // users/me 실패 → authStore에 userId가 세팅되지 않음
        // AuthBootstrap은 accessToken은 유지하므로 AuthGuard는 리다이렉트하지 않고
        // MyPage가 userId=null 상태로 "로그인이 필요합니다." 안내를 표시한다.
        if (url.includes('users/me') && method === 'GET') {
          return new Response(
            JSON.stringify({ error_detail: '인증이 필요합니다.' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } },
          )
        }
        return orig(input, init)
      }
    })
    await page.goto('/mypage')
    await expect(page.getByText('로그인이 필요합니다.')).toBeVisible({ timeout: 8_000 })
  })
})

// ─── 프로필 API 실패 ─────────────────────────────────────────────────────────

test.describe('프로필 API 실패', () => {
  test('GET /users/:userId/profile 500 응답 시 에러 문구가 표시된다', async ({ page }) => {
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
            JSON.stringify({ error_detail: '서버 오류가 발생했습니다.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          )
        }
        return orig(input, init)
      }
    }, MOCK_USER_ID)

    await page.goto('/mypage')
    await expect(page.getByText('프로필을 불러올 수 없습니다.')).toBeVisible({ timeout: 8_000 })
  })

  test('네트워크 오류 시 에러 문구가 표시된다', async ({ page }) => {
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
})
