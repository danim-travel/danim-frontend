/**
 * 유저 관련 Mock 핸들러. 마이페이지/타인 프로필 조회, 내 정보 수정/탈퇴, 팔로워/팔로잉 목록 조회 시 사용한다.
 */
import { http, HttpResponse, type HttpResponseResolver } from 'msw'
import type { UserProfilePost, UserProfileResponse, FollowUser, UserSearchResult } from '@/types'
import { SHOWCASE_MOCK_USER_ID } from '../constants'

const mockHeights = [320, 480, 260, 560, 400, 300, 520, 380, 440, 280, 500, 360, 420, 600, 340, 460, 240, 540, 390, 470]

const mockPosts: UserProfilePost[] = Array.from({ length: 20 }, (_, i) => ({
  post_id: `01HZXK9P${String(i + 1).padStart(2, '0')}ABCDEFGHJKLMNPQRST`,
  title: `여행 기록 ${i + 1}`,
  thumbnail: `https://picsum.photos/seed/userpost${i + 1}/480/${mockHeights[i % mockHeights.length]}`,
}))

const mockUserProfile: UserProfileResponse = {
  name: '홍길동',
  nickname: 'test_nickname',
  profile_img: 'https://picsum.photos/seed/userprofile/200/200',
  intro: '여행을 좋아하는 사람입니다.',
  follower: 10,
  following: 5,
  is_following: false,
  posts_count: mockPosts.length,
  posts: mockPosts,
}

// 추후 UI 확인용 mock 데이터 (팔로워/팔로잉 목록)
export const mockFollowers: FollowUser[] = [
  { user_id: 'other-user-1', nickname: 'traveler_kim', profile_img: 'https://picsum.photos/seed/otherprofile1/200/200', is_following: false },
  { user_id: 'other-user-2', nickname: 'yh_explorer', profile_img: null, is_following: true },
  { user_id: 'follower-3', nickname: 'jeju_lover', profile_img: 'https://picsum.photos/seed/follower3/200/200', is_following: false },
  { user_id: 'follower-4', nickname: 'road_tripper', profile_img: 'https://picsum.photos/seed/follower4/200/200', is_following: true },
]

export const mockFollowings: FollowUser[] = [
  { user_id: 'other-user-2', nickname: 'yh_explorer', profile_img: null, is_following: true },
  { user_id: 'following-1', nickname: 'alps_hiker', profile_img: 'https://picsum.photos/seed/following1/200/200', is_following: true },
  { user_id: 'following-2', nickname: 'seoul_wanderer', profile_img: 'https://picsum.photos/seed/following2/200/200', is_following: true },
]


const mockOtherProfiles: Record<string, UserProfileResponse> = {
  'other-user-1': {
    name: '김철수',
    nickname: 'traveler_kim',
    profile_img: 'https://picsum.photos/seed/otherprofile1/200/200',
    intro: '국내 여행 전문가입니다.',
    follower: 120,
    following: 80,
    is_following: false,
    posts_count: 5,
    posts: mockPosts.slice(0, 5),
  },
  'other-user-2': {
    name: '이영희',
    nickname: 'yh_explorer',
    profile_img: null,
    intro: '',
    follower: 3,
    following: 10,
    is_following: true,
    posts_count: 2,
    posts: mockPosts.slice(0, 2),
  },
}

/** Authorization 헤더가 없으면 401 응답을 반환하고, 있으면 null을 반환한다. */
function requireAuth(request: Request) {
  if (!request.headers.get('Authorization')) {
    return HttpResponse.json(
      { error_detail: '자격 인증 데이터가 제공되지 않습니다.' },
      { status: 401 },
    )
  }
  return null
}

// trailing slash 유무에 무관하게 처리하기 위해 두 패턴을 모두 등록한다.
/** 팔로워 목록 GET 요청 핸들러. mockFollowers를 반환한다. */
const handleFollowers: HttpResponseResolver = ({ request, params }) => {
  const authError = requireAuth(request as Request)
  if (authError) return authError
  const userId = params.userId as string
  if (userId === 'not-found') {
    return HttpResponse.json(
      { error_detail: '존재하지 않는 유저입니다.' },
      { status: 404 },
    )
  }
  return HttpResponse.json(mockFollowers)
}

/** 팔로잉 목록 GET 요청 핸들러. mockFollowings를 반환한다. */
const handleFollowing: HttpResponseResolver = ({ request, params }) => {
  const authError = requireAuth(request as Request)
  if (authError) return authError
  const userId = params.userId as string
  if (userId === 'not-found') {
    return HttpResponse.json(
      { error_detail: '존재하지 않는 유저입니다.' },
      { status: 404 },
    )
  }
  return HttpResponse.json(mockFollowings)
}

const mockSearchUsers: UserSearchResult[] = [
  { user_id: 'other-user-1', nickname: 'traveler_kim', profile_img: 'https://picsum.photos/seed/otherprofile1/200/200' },
  { user_id: 'other-user-2', nickname: 'yh_explorer', profile_img: null },
  { user_id: 'follower-3', nickname: 'jeju_lover', profile_img: 'https://picsum.photos/seed/follower3/200/200' },
  { user_id: 'follower-4', nickname: 'road_tripper', profile_img: 'https://picsum.photos/seed/follower4/200/200' },
  { user_id: 'following-1', nickname: 'alps_hiker', profile_img: 'https://picsum.photos/seed/following1/200/200' },
  { user_id: 'following-2', nickname: 'seoul_wanderer', profile_img: 'https://picsum.photos/seed/following2/200/200' },
  { user_id: 'search-user-3', nickname: 'busan_foodie', profile_img: 'https://picsum.photos/seed/searchuser3/200/200' },
  { user_id: 'search-user-4', nickname: 'jeju_traveler', profile_img: 'https://picsum.photos/seed/searchuser4/200/200' },
]

export const usersHandlers = [
  http.get('*/users', ({ request }) => {
    const authError = requireAuth(request)
    if (authError) return authError
    const search = new URL(request.url).searchParams.get('search')?.toLowerCase().trim() ?? ''
    if (!search) return HttpResponse.json({ results: [] })
    const results = mockSearchUsers.filter((u) => u.nickname.toLowerCase().includes(search))
    return HttpResponse.json({ results })
  }),

  http.get('*/users/:userId/profile', ({ request, params }) => {
    const authError = requireAuth(request)
    if (authError) return authError
    const userId = params.userId as string
    if (userId === SHOWCASE_MOCK_USER_ID || userId === 'me') {
      return HttpResponse.json(mockUserProfile)
    }
    const other = mockOtherProfiles[userId]
    if (!other) {
      return HttpResponse.json({ error_detail: '존재하지 않는 유저입니다.' }, { status: 404 })
    }
    return HttpResponse.json(other)
  }),
]

export const followHandlers = [
  http.get('*/users/:userId/followers/', handleFollowers),
  http.get('*/users/:userId/followers', handleFollowers),

  http.get('*/users/:userId/following/', handleFollowing),
  http.get('*/users/:userId/following', handleFollowing),
]
