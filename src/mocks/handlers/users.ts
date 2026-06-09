/**
 * 유저 관련 Mock 핸들러. 마이페이지/타인 프로필 조회 시 사용한다.
 */
import { http, HttpResponse } from 'msw'
import type { UserProfilePost, UserProfileResponse } from '@/types'
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

export const usersHandlers = [
  // 내 정보 조회 — 백엔드 개발 완료 전 임시 mock
  http.get('*/users/me', ({ request }) => {
    if (!request.headers.get('Authorization')) {
      return HttpResponse.json(
        { error_detail: '자격 인증 데이터가 제공되지 않습니다.' },
        { status: 401 },
      )
    }
    return HttpResponse.json({
      user_id: MOCK_USER.userId,
      nickname: MOCK_USER.nickname,
      profile_img: MOCK_USER.profileImg,
    })
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
