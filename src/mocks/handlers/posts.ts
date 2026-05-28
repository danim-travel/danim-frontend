/**
 * 게시글 관련 Mock 핸들러. showcase 페이지 테스트용 더미 데이터를 응답한다.
 */
import { http, HttpResponse } from 'msw'
import type { PostDetail } from '@/types'

const mockPostDetail: PostDetail = {
  post: {
    post_id: 'showcase-post',
    title: '제주도 동쪽 드라이브',
    content: '성산일출봉부터 섭지코지까지 이어지는 코스예요.',
    thumbnail: 'https://picsum.photos/seed/jeju/480/320',
  },
  user: {
    user_id: 1,
    nickname: '다님이',
    profile_img: 'https://picsum.photos/seed/user1/100/100',
  },
  spots: [
    {
      spot_id: 'spot-1',
      location: {
        place_name: '성산일출봉',
        address_name: '제주특별자치도 서귀포시 성산읍 성산리',
        road_address_name: '제주특별자치도 서귀포시 성산읍 일출로 284-12',
        x: 126.942767,
        y: 33.458806,
      },
      images: [
        {
          img_url: 'https://picsum.photos/seed/jeju1/480/480',
          original_image_url: 'https://picsum.photos/seed/jeju1/1080/1080',
          img_order: 1,
        },
        {
          img_url: 'https://picsum.photos/seed/jeju2/480/480',
          original_image_url: 'https://picsum.photos/seed/jeju2/1080/1080',
          img_order: 2,
        },
      ],
      content: '성산일출봉 정상에서 보는 일출이 정말 아름다워요.',
      order: 1,
    },
    {
      spot_id: 'spot-2',
      location: {
        place_name: '섭지코지',
        address_name: '제주특별자치도 서귀포시 성산읍 신양리',
        road_address_name: '제주특별자치도 서귀포시 성산읍 섭지코지로',
        x: 126.930318,
        y: 33.440234,
      },
      images: [
        {
          img_url: 'https://picsum.photos/seed/jeju3/480/480',
          original_image_url: 'https://picsum.photos/seed/jeju3/1080/1080',
          img_order: 1,
        },
      ],
      content: '드라마 촬영지로 유명한 섭지코지. 바람이 강하게 불었어요.',
      order: 2,
    },
  ],
  like_count: 24,
  is_liked: false,
  comment_count: 7,
  is_bookmarked: false,
  is_owner: false,
}

export const postsHandlers = [
  http.get('*/v1/posts/:postId', () => {
    return HttpResponse.json(mockPostDetail)
  }),
]
