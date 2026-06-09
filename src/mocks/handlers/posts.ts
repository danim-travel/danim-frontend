/**
 * 게시글 관련 Mock 핸들러. showcase 페이지 테스트용 더미 데이터를 응답한다.
 */
import { http, HttpResponse } from 'msw'
import type { PostDetail } from '@/types'
import { likedPosts, bookmarkedPosts, postLikeCounts } from './interactions'
import { getCommentCount } from './comments'

const mockPostDetail: PostDetail = {
  post: {
    post_id: 'showcase-post',
    title: '제주도 동쪽 드라이브',
    description: '성산일출봉부터 섭지코지까지 이어지는 코스예요.',
    thumbnail: 'https://picsum.photos/seed/jeju/480/320',
    created_at: '2026-05-28T11:45:00Z',
  },
  user: {
    user_id: '01KSHF7EQEGJRVED7VSHJQWBYX',
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
        // 가로 긴 이미지 (16:9)
        {
          img_url: 'https://picsum.photos/seed/jeju1/960/540',
          original_img: 'https://picsum.photos/seed/jeju1/1920/1080',
          img_order: 1,
        },
        // 세로 긴 이미지 (9:16)
        {
          img_url: 'https://picsum.photos/seed/jeju2/540/960',
          original_img: 'https://picsum.photos/seed/jeju2/1080/1920',
          img_order: 2,
        },
        // 1:1 이미지
        {
          img_url: 'https://picsum.photos/seed/jeju4/800/800',
          original_img: 'https://picsum.photos/seed/jeju4/1080/1080',
          img_order: 3,
        },
      ],
      content: '성산일출봉 정상에서 보는 일출이 정말 아름다워요.\n\n새벽 4시에 일어나서 등산을 시작했는데, 정상까지 약 30분 정도 걸렸어요. 계단이 잘 정비되어 있어서 생각보다 쉽게 올라갈 수 있었습니다.\n\n정상에서 본 일출은 정말 장관이었어요. 바다 위로 떠오르는 해를 보며 한 해의 소원을 빌었습니다. 주변에 사진 찍기 좋은 포인트도 많아서 인생샷도 건졌어요.\n\n참고로 입장료는 5,000원이고, 주차장도 넓어서 편리해요. 근처에 우뭇가사리 칼국수 맛집도 있으니 일출 보고 아침 식사로 추천드려요. 다음에는 친구들이랑 다시 와서 우도까지 가보고 싶네요. 정말 잊을 수 없는 여행이었습니다.',
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
          original_img: 'https://picsum.photos/seed/jeju3/1080/1080',
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
  http.get('*/posts/:postId', ({ params }) => {
    const postId = params.postId as string
    return HttpResponse.json({
      ...mockPostDetail,
      comment_count: getCommentCount(postId), // 댓글 목 데이터와 동기화
      is_liked: likedPosts.has(postId),
      is_bookmarked: bookmarkedPosts.has(postId),
      like_count: postLikeCounts.get(postId) ?? mockPostDetail.like_count,
    })
  }),

  // 게시글 작성
  http.post('*/posts', async ({ request }) => {
    if (!request.headers.get('Authorization')) {
      return HttpResponse.json(
        { error_detail: '인증되지 않은 사용자입니다.' },
        { status: 401 },
      )
    }
    const body = await request.json() as Record<string, unknown>
    if (!body.title) {
      return HttpResponse.json(
        { error_detail: { title: ['이 필드는 필수 항목입니다.'] } },
        { status: 400 },
      )
    }
    return HttpResponse.json(
      { detail: '게시글이 작성되었습니다.' },
      { status: 201 },
    )
  }),

  // presigned URL 발급
  http.post('*/posts/presigned-url', async ({ request }) => {
    if (!request.headers.get('Authorization')) {
      return HttpResponse.json(
        { error_detail: '자격 인증 데이터가 제공되지 않습니다.' },
        { status: 401 },
      )
    }
    const body = await request.json() as Record<string, unknown>
    const originalImg = body.original_img as string | undefined
    const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    const ext = originalImg?.split('.').pop()?.toLowerCase()
    if (!originalImg || !ext || !allowedExts.includes(ext)) {
      return HttpResponse.json(
        { error_detail: '지원하지 않는 파일 형식입니다.' },
        { status: 400 },
      )
    }
    const uuid = crypto.randomUUID()
    const key = `uploads/images/posts/${uuid}.${ext}`
    const baseUrl = `https://oz-externship.s3.ap-northeast-2.amazonaws.com/${key}`
    return HttpResponse.json({
      presigned_url: `${baseUrl}?AWSAccessKeyId=AKIAIOSFODNN7EXAMPLE&Signature=tHe%2BUpLoAdSiGnAtUrE%3D&Expires=1717600000`,
      img_url: baseUrl,
      key,
    })
  }),

  // S3 presigned URL PUT 요청 — CORS 우회용 mock
  http.put('https://*.s3.ap-northeast-2.amazonaws.com/*', () => {
    return new HttpResponse(null, { status: 200 })
  }),
]
