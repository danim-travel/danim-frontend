/**
 * 유저 관련 Mock 핸들러. 마이페이지/타인 프로필 조회 시 사용한다.
 */
import { http, HttpResponse } from 'msw'
import type { UserProfilePost, UserProfileResponse } from '@/types'

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
  is_following: true,
  posts_count: mockPosts.length,
  posts: mockPosts,
}

export const usersHandlers = [
  http.get('*/v1/users/:userId/profile', ({ request, params }) => {
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

    return HttpResponse.json(mockUserProfile)
  }),
]
