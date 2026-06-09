/**
 * 유저 관련 Mock 핸들러. 프로필 조회, 팔로우/언팔로우, 팔로워/팔로잉 목록 조회 시 사용한다.
 */
import { http, HttpResponse, type HttpResponseResolver } from 'msw'
import type { UserProfilePost, UserProfileResponse, FollowResponse, FollowUser } from '@/types'
import { MOCK_USER } from '../constants'

const mockPosts: UserProfilePost[] = Array.from({ length: 20 }, (_, i) => ({
  post_id: `01HZXK9P${String(i + 1).padStart(2, '0')}ABCDEFGHJKLMNPQRST`,
  title: `여행 기록 ${i + 1}`,
  thumbnail: `https://picsum.photos/seed/userpost${i + 1}/480/480`,
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

// 팔로우 상태를 in-memory로 관리한다. key: userId, value: is_following
const followState: Record<string, boolean> = {
  'other-user-1': false,
  'other-user-2': true,
  'follower-3': false,
  'follower-4': true,
  'following-1': true,
  'following-2': true,
}

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

// trailing slash 유무에 무관하게 처리하기 위해 두 패턴을 모두 등록한다.
const handleFollowers: HttpResponseResolver = ({ request, params }) => {
  if (!request.headers.get('Authorization')) {
    return HttpResponse.json(
      { error_detail: '자격 인증 데이터가 제공되지 않습니다.' },
      { status: 401 },
    )
  }
  const userId = params.userId as string
  if (userId === 'not-found') {
    return HttpResponse.json(
      { error_detail: '존재하지 않는 유저입니다.' },
      { status: 404 },
    )
  }
  return HttpResponse.json(mockFollowers)
}

const handleFollowing: HttpResponseResolver = ({ request, params }) => {
  if (!request.headers.get('Authorization')) {
    return HttpResponse.json(
      { error_detail: '자격 인증 데이터가 제공되지 않습니다.' },
      { status: 401 },
    )
  }
  const userId = params.userId as string
  if (userId === 'not-found') {
    return HttpResponse.json(
      { error_detail: '존재하지 않는 유저입니다.' },
      { status: 404 },
    )
  }
  return HttpResponse.json(mockFollowings)
}

export const usersHandlers = [
  http.get('*/users/:userId/followers/', handleFollowers),
  http.get('*/users/:userId/followers', handleFollowers),

  http.get('*/users/:userId/following/', handleFollowing),
  http.get('*/users/:userId/following', handleFollowing),

  http.post('*/users/:userId/follow', ({ request, params }) => {
    if (!request.headers.get('Authorization')) {
      return HttpResponse.json(
        { error_detail: '자격 인증 데이터가 제공되지 않습니다.' },
        { status: 401 },
      )
    }

    const userId = params.userId as string
    if (userId === 'not-found') {
      return HttpResponse.json(
        { error_detail: '존재하지 않는 유저입니다.' },
        { status: 404 },
      )
    }

    if (followState[userId]) {
      return HttpResponse.json(
        { error_detail: '이미 팔로우한 유저입니다.' },
        { status: 409 },
      )
    }

    followState[userId] = true
    const profile = mockOtherProfiles[userId]
    const followerCount = profile ? profile.follower + 1 : 1
    if (profile) {
      profile.follower = followerCount
      profile.is_following = true
    }

    // 목록 재조회 시 상태가 유지되도록 mock 배열도 동기화
    const inFollowers = mockFollowers.find(u => u.user_id === userId)
    if (inFollowers) inFollowers.is_following = true
    const inFollowings = mockFollowings.find(u => u.user_id === userId)
    if (inFollowings) inFollowings.is_following = true

    const response: FollowResponse = { is_followed: true, follower_count: followerCount }
    return HttpResponse.json(response)
  }),

  http.delete('*/users/:userId/follow', ({ request, params }) => {
    if (!request.headers.get('Authorization')) {
      return HttpResponse.json(
        { error_detail: '자격 인증 데이터가 제공되지 않습니다.' },
        { status: 401 },
      )
    }

    const userId = params.userId as string
    if (userId === 'not-found') {
      return HttpResponse.json(
        { error_detail: '존재하지 않는 유저입니다.' },
        { status: 404 },
      )
    }

    if (!followState[userId]) {
      return HttpResponse.json(
        { error_detail: '팔로우하지 않은 유저입니다.' },
        { status: 409 },
      )
    }

    followState[userId] = false
    const profile = mockOtherProfiles[userId]
    const followerCount = profile ? Math.max(0, profile.follower - 1) : 0
    if (profile) {
      profile.follower = followerCount
      profile.is_following = false
    }

    // 목록 재조회 시 상태가 유지되도록 mock 배열도 동기화
    const inFollowers = mockFollowers.find(u => u.user_id === userId)
    if (inFollowers) inFollowers.is_following = false
    const inFollowings = mockFollowings.find(u => u.user_id === userId)
    if (inFollowings) inFollowings.is_following = false

    const response: FollowResponse = { is_followed: false, follower_count: followerCount }
    return HttpResponse.json(response)
  }),

  http.get('*/users/:userId/profile', ({ request, params }) => {
    if (!request.headers.get('Authorization')) {
      return HttpResponse.json(
        { error_detail: '자격 인증 데이터가 제공되지 않습니다.' },
        { status: 401 },
      )
    }

    const userId = params.userId as string
    if (userId === 'not-found') {
      return HttpResponse.json(
        { error_detail: '존재하지 않는 유저입니다.' },
        { status: 404 },
      )
    }

    return HttpResponse.json(mockOtherProfiles[userId] ?? mockUserProfile)
  }),
]
