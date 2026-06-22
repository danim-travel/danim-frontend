/**
 * 마이페이지 E2E 테스트 공통 헬퍼.
 *
 * 모든 네트워크 인터셉트는 window.fetch 패치 방식으로 MSW(Service Worker)보다
 * 먼저 요청을 가로챈다. 각 헬퍼는 독립적으로 오버라이드를 추가할 수 있도록
 * args 객체를 page.addInitScript에 직렬화해서 전달한다.
 */

import { expect, type Page } from '@playwright/test'

// ─── 상수 ──────────────────────────────────────────────────────────────────

export const MOCK_USER_ID = 'mock-user-id'
export const MOCK_NICKNAME = 'test_nickname'
export const MOCK_POST_ID = 'post-001'

export const MOCK_PROFILE = {
  name: '홍길동',
  nickname: MOCK_NICKNAME,
  profile_img: null as string | null,
  intro: '여행을 좋아하는 사람입니다.',
  follower: 10,
  following: 5,
  is_following: false,
  posts_count: 3,
  posts: [
    { post_id: MOCK_POST_ID, title: '여행 기록 1', thumbnail: 'https://picsum.photos/seed/p1/480/320' },
    { post_id: 'post-002', title: '여행 기록 2', thumbnail: 'https://picsum.photos/seed/p2/480/400' },
    { post_id: 'post-003', title: '여행 기록 3', thumbnail: 'https://picsum.photos/seed/p3/480/280' },
  ],
}

export const MOCK_POST_DETAIL = {
  post: {
    post_id: MOCK_POST_ID,
    title: '여행 기록 1',
    description: '제주도 여행 기록입니다.',
    thumbnail: 'https://picsum.photos/seed/p1/480/320',
    created_at: '2026-06-01T10:00:00Z',
  },
  user: {
    user_id: MOCK_USER_ID,
    nickname: MOCK_NICKNAME,
    profile_img: null as string | null,
  },
  spots: [
    {
      spot_id: 'spot-1',
      location: {
        place_name: '성산일출봉',
        address_name: '제주특별자치도 서귀포시 성산읍 성산리',
        road_address_name: '제주특별자치도 서귀포시 성산읍 일출로 284-12',
        x: '126.942767',
        y: '33.458806',
      },
      images: [
        {
          img_url: 'https://picsum.photos/seed/p1/480/320',
          original_img: 'https://picsum.photos/seed/p1/960/640',
          img_order: 1,
        },
      ],
      content: '탁 트인 경치가 정말 인상적이었어요.',
      order: 1,
    },
  ],
  like_count: 5,
  is_liked: false,
  comment_count: 2,
  is_bookmarked: false,
  is_owner: true,
}

export const MOCK_COMMENTS = {
  previous: null,
  next: null,
  results: [
    {
      comment_id: 'comment-1',
      user: {
        id: 'other-user-1',
        is_deleted: false,
        nickname: '여행러버',
        profile_img: null,
      },
      content: '정말 멋진 여행이네요!',
      comment_img: { img_url: null, original_img: null, key: null },
      created_at: '2026-06-01T11:00:00Z',
      updated_at: null,
      is_liked: false,
      like_count: 2,
    },
    {
      comment_id: 'comment-2',
      user: {
        id: MOCK_USER_ID,
        is_deleted: false,
        nickname: MOCK_NICKNAME,
        profile_img: null,
      },
      content: '저도 또 가고 싶어요.',
      comment_img: { img_url: null, original_img: null, key: null },
      created_at: '2026-06-01T12:00:00Z',
      updated_at: null,
      is_liked: false,
      like_count: 0,
    },
  ],
}

// ─── fetch 스텁 빌더 ────────────────────────────────────────────────────────

type StubEntry = {
  match: (url: string, method: string) => boolean
  respond: (url: string, method: string, body: unknown) => Response | Promise<Response>
}

/**
 * 인증 + 마이페이지 기본 API 스텁을 주입하고 /mypage로 이동한다.
 * `extraStubs` 배열을 넘기면 기본 스텁 앞에 추가되어 우선 매칭된다.
 */
export async function setupMyPage(
  page: Page,
  opts: {
    profile?: typeof MOCK_PROFILE
    extraStubs?: StubEntry[]
    awaitSelector?: string
  } = {},
) {
  const profile = opts.profile ?? MOCK_PROFILE
  const userId = MOCK_USER_ID

  // page.addInitScript는 직렬화 가능한 값만 전달할 수 있으므로
  // 모든 응답 데이터를 JSON으로 직렬화해 넘긴다.
  const args = {
    userId,
    profile: JSON.stringify(profile),
    extraStubs: opts.extraStubs?.map((s) => s.toString()) ?? [],
  }

  await page.addInitScript((a: { userId: string; profile: string; extraStubs: string[] }) => {
    const profileData = JSON.parse(a.profile)
    const orig = window.fetch.bind(window)

    window.fetch = async (input, init) => {
      const url = input instanceof Request ? input.url : String(input)
      const method = input instanceof Request ? input.method : (init?.method ?? 'GET')

      // 1. token/refresh → 인증 세션 복원
      if (url.includes('users/token/refresh') && method === 'POST') {
        return new Response(
          JSON.stringify({ access_token: 'mock_access_token' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }

      // 2. GET users/me → authStore에 userId 세팅
      if (url.includes('users/me') && method === 'GET') {
        return new Response(
          JSON.stringify({
            user_id: a.userId,
            nickname: profileData.nickname,
            profile_img: profileData.profile_img,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }

      // 3. GET users/:userId/profile → 마이페이지 프로필
      if (url.includes(`users/${a.userId}/profile`) && method === 'GET') {
        return new Response(JSON.stringify(profileData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      return orig(input, init)
    }
  }, args)

  await page.goto('/mypage')
  const awaitSel = opts.awaitSelector ?? `h2:has-text("${profile.nickname}")`
  await expect(page.locator(awaitSel)).toBeVisible({ timeout: 10_000 })
}

/**
 * 게시글 모달 관련 API도 스텁하고 /mypage로 이동한다.
 * 프로필 썸네일 클릭 → PostModal 열림까지 포함하는 테스트에서 사용.
 */
export async function setupMyPageWithModal(
  page: Page,
  opts: {
    postDetail?: typeof MOCK_POST_DETAIL
    comments?: typeof MOCK_COMMENTS
    profile?: typeof MOCK_PROFILE
  } = {},
) {
  const postDetail = opts.postDetail ?? MOCK_POST_DETAIL
  const comments = opts.comments ?? MOCK_COMMENTS
  const profile = opts.profile ?? MOCK_PROFILE
  const userId = MOCK_USER_ID

  await page.addInitScript(
    (a: { userId: string; profile: string; postDetail: string; comments: string }) => {
      const profileData = JSON.parse(a.profile)
      const postDetailData = JSON.parse(a.postDetail)
      const commentsData = JSON.parse(a.comments)
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
            JSON.stringify({
              user_id: a.userId,
              nickname: profileData.nickname,
              profile_img: profileData.profile_img,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }

        if (url.includes(`users/${a.userId}/profile`) && method === 'GET') {
          return new Response(JSON.stringify(profileData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        // POST /posts/:postId/like — 좋아요 토글
        if (url.match(/posts\/[^/]+\/like$/) && method === 'POST') {
          return new Response(
            JSON.stringify({ is_liked: true, like_count: postDetailData.like_count + 1 }),
            { status: 201, headers: { 'Content-Type': 'application/json' } },
          )
        }

        // DELETE /posts/:postId/like — 좋아요 취소
        if (url.match(/posts\/[^/]+\/like$/) && method === 'DELETE') {
          return new Response(
            JSON.stringify({ is_liked: false, like_count: Math.max(0, postDetailData.like_count - 1) }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }

        // POST /posts/:postId/bookmark
        if (url.match(/posts\/[^/]+\/bookmark$/) && method === 'POST') {
          return new Response(
            JSON.stringify({ is_bookmarked: true }),
            { status: 201, headers: { 'Content-Type': 'application/json' } },
          )
        }

        // DELETE /posts/:postId/bookmark
        if (url.match(/posts\/[^/]+\/bookmark$/) && method === 'DELETE') {
          return new Response(
            JSON.stringify({ is_bookmarked: false }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }

        // GET /posts/:postId — 게시글 상세
        if (url.match(/\/posts\/[^/]+$/) && method === 'GET') {
          return new Response(JSON.stringify(postDetailData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        // GET /comments?post_id=... — 댓글 목록
        if (url.includes('/comments') && method === 'GET') {
          return new Response(JSON.stringify(commentsData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        // POST /comments — 댓글 작성
        if (url.includes('/comments') && method === 'POST') {
          return new Response(
            JSON.stringify({ comment_id: 'new-comment', detail: '댓글이 작성되었습니다.' }),
            { status: 201, headers: { 'Content-Type': 'application/json' } },
          )
        }

        // DELETE /posts/:postId — 게시글 삭제
        if (url.match(/\/posts\/[^/]+$/) && method === 'DELETE') {
          return new Response(null, { status: 204 })
        }

        return orig(input, init)
      }
    },
    {
      userId,
      profile: JSON.stringify(profile),
      postDetail: JSON.stringify(postDetail),
      comments: JSON.stringify(comments),
    },
  )

  await page.goto('/mypage')
  await expect(page.locator(`h2:has-text("${profile.nickname}")`)).toBeVisible({ timeout: 10_000 })
}

/** 첫 번째 게시글 썸네일을 클릭하고 PostModal이 열릴 때까지 대기한다. */
export async function openFirstPostModal(page: Page) {
  await page.locator('[data-post-id]').first().click()
  await expect(page.getByTestId('post-modal')).toBeVisible({ timeout: 8_000 })
}
