import { expect, type Page } from '@playwright/test'

/**
 * token/refresh + GET /users/me 를 스텁하여 인증 상태를 복원한 뒤 /followers 로 이동한다.
 *
 * - token/refresh: MSW authHandlers 없이도 silent refresh가 성공하도록 스텁
 * - GET /users/me: getCurrentUser() 결과로 userId='mock-user-id' 를 설정해야
 *   FollowersPage 가 팔로워/팔로잉 목록을 fetch 한다
 * - POST/DELETE follow/{userId}: MSW handler 제거로 인해 실제 백엔드 대신 성공 응답 반환
 * - GET followers/following: toggle 이후 onSettled 재조회 시 변경된 is_following 반영
 */
export async function setupAuthenticatedFollowers(
  page: Page,
  tab: 'followers' | 'following' = 'followers',
) {
  await page.addInitScript(() => {
    // follow 토글 상태 추적 (onSettled 재조회 응답을 동기화하기 위해 사용)
    const followedUsers = new Set()
    const unfollowedUsers = new Set()

    const orig = window.fetch.bind(window)
    window.fetch = async (input, init) => {
      const url = input instanceof Request ? input.url : String(input)
      const method = input instanceof Request ? input.method : (init?.method ?? 'GET')

      if (url.includes('/users/token/refresh') && method === 'POST') {
        return new Response(
          JSON.stringify({ access_token: 'mock_access_token' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }

      // getCurrentUser() 가 호출하는 GET /users/me — MSW 핸들러 주석 처리로 인해 스텁 필요
      // /users/me/detail, /users/me/profile-image 등 하위 경로는 MSW 가 처리한다
      if (url.includes('/users/me') && !url.includes('/users/me/') && method === 'GET') {
        return new Response(
          JSON.stringify({
            user_id: 'mock-user-id',
            nickname: 'test_nickname',
            profile_img: null,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }

      // POST follow/{userId} — MSW handler 제거 후 실제 백엔드 대신 성공 응답 반환
      if (/\/follow\/[^/]+$/.test(url) && method === 'POST') {
        const userId = url.split('/follow/').pop() ?? ''
        followedUsers.add(userId)
        unfollowedUsers.delete(userId)
        return new Response(
          JSON.stringify({ is_followed: true, follower_count: 1 }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }

      // DELETE follow/{userId} — MSW handler 제거 후 실제 백엔드 대신 성공 응답 반환
      if (/\/follow\/[^/]+$/.test(url) && method === 'DELETE') {
        const userId = url.split('/follow/').pop() ?? ''
        unfollowedUsers.add(userId)
        followedUsers.delete(userId)
        return new Response(
          JSON.stringify({ is_followed: false, follower_count: 0 }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }

      // GET followers/following — toggle 발생 후 재조회 시 변경된 is_following 반영
      if (
        (url.includes('/followers') || url.includes('/following')) &&
        method === 'GET' &&
        (followedUsers.size > 0 || unfollowedUsers.size > 0)
      ) {
        const response = await orig(input, init)
        if (response.ok) {
          const data = await response.json()
          const updated = (data as Array<{ user_id: string; is_following: boolean }>).map((user) => {
            if (followedUsers.has(user.user_id)) return { ...user, is_following: true }
            if (unfollowedUsers.has(user.user_id)) return { ...user, is_following: false }
            return user
          })
          return new Response(JSON.stringify(updated), {
            status: response.status,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        return response
      }

      return orig(input, init)
    }
  })

  const path = tab === 'following' ? '/followers?tab=following' : '/followers'
  await page.goto(path)

  // MSW 가 mockFollowers / mockFollowings 를 반환한 뒤 첫 항목이 보일 때까지 대기
  if (tab === 'followers') {
    await expect(page.getByText('traveler_kim')).toBeVisible()
  } else {
    await expect(page.getByText('alps_hiker')).toBeVisible()
  }
}

/**
 * 특정 사용자 행에서 팔로우/언팔로우 API 를 실패시키는 fetch 스텁을 등록한다.
 * page.evaluate 로 실행하므로 페이지 로드 이후에 호출해야 한다.
 *
 * 400 응답을 반환하여 getApiErrorMessage 가 client fallback('팔로우 변경에 실패했습니다.')을
 * 표시하도록 한다. 500 반환 시 getApiErrorMessage 가 서버 오류 고정 문구를 반환하므로 400 사용.
 */
export async function stubFollowApiFailure(
  page: Page,
  method: 'POST' | 'DELETE',
) {
  await page.evaluate((m) => {
    const orig = window.fetch.bind(window)
    window.fetch = async (input, init) => {
      const url = input instanceof Request ? input.url : String(input)
      const reqMethod = input instanceof Request ? input.method : (init?.method ?? 'GET')
      if (url.includes('/follow') && reqMethod === m) {
        return new Response(
          JSON.stringify({ error_detail: '팔로우 변경에 실패했습니다.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return orig(input, init)
    }
  }, method)
}
