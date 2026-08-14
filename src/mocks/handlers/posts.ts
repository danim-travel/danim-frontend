/**
 * 게시글 관련 Mock 핸들러.
 * GET /posts/:postId — postId로 ALL_FEED_ITEMS에서 해당 게시글을 찾아 PostDetail을 동적 생성.
 * showcase-post ID는 별도 더미 데이터로 fallback.
 */
import { http, HttpResponse } from 'msw'
import type { BookmarkListItem, BookmarkListResponse, PostDetail, Spot } from '@/types'
import { likedPosts, bookmarkedPosts, postLikeCounts } from './interactions'
import { getCommentCount } from './comments'
import { ALL_FEED_ITEMS } from './mainFeed'

const titles = [
  '제주도 동쪽 드라이브 코스',
  '부산 해운대 야경 투어',
  '경주 문화유산 탐방',
  '강릉 커피거리 & 해변',
  '속초 청초호 산책 코스',
  '여수 밤바다 여행기',
  '전주 한옥마을 하루 일정',
  '남이섬 가을 단풍 나들이',
  '서울 북촌 골목 산책',
  '울릉도 1박 2일 코스',
]

const spotContents = [
  '탁 트인 경치가 정말 인상적이었어요. 날씨도 맑아서 멀리까지 잘 보였습니다.',
  '로컬 맛집에서 점심을 먹었어요. 줄이 길었지만 기다릴 만한 가치가 있었습니다.',
  '해 질 무렵에 방문했는데 노을이 정말 아름다웠어요. 사진 찍기 딱 좋은 타이밍이었습니다.',
  '생각보다 규모가 크고 볼거리가 많았어요. 여유 있게 2~3시간 잡고 가는 걸 추천합니다.',
  '조용하고 한적해서 힐링이 됐어요. 주변에 카페도 있어서 쉬어가기 좋습니다.',
]

const showcaseFallback: PostDetail = {
  post: {
    post_id: 'showcase-post',
    title: '제주도 동쪽 드라이브',
    description: '성산일출봉부터 섭지코지까지 이어지는 코스예요.',
    thumbnail: 'https://picsum.photos/seed/showcase0spot0/480/320',
    thumbnail_width: 480,
    thumbnail_height: 320,
    created_at: '2026-05-28T11:45:00Z',
    updated_at: '2026-05-28T11:45:00Z',
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
        x: '126.942767',
        y: '33.458806',
      },
      images: [
        {
          img_url: 'https://picsum.photos/seed/showcase0spot0/480/320',
          original_img: 'https://picsum.photos/seed/showcase0spot0/960/640',
          img_order: 1,
          key: 'mock/showcase0spot0',
          width: 480,
          height: 320,
        },
        {
          img_url: 'https://picsum.photos/seed/showcase0spot0b/540/960',
          original_img: 'https://picsum.photos/seed/showcase0spot0b/1080/1920',
          img_order: 2,
          key: 'mock/showcase0spot0b',
          width: 540,
          height: 960,
        },
      ],
      content: spotContents[0],
      order: 1,
    },
    {
      spot_id: 'spot-2',
      location: {
        place_name: '섭지코지',
        address_name: '제주특별자치도 서귀포시 성산읍 신양리',
        road_address_name: '제주특별자치도 서귀포시 성산읍 섭지코지로',
        x: '126.930318',
        y: '33.440234',
      },
      images: [
        {
          img_url: 'https://picsum.photos/seed/showcase0spot1/480/320',
          original_img: 'https://picsum.photos/seed/showcase0spot1/960/640',
          img_order: 1,
          key: 'mock/showcase0spot1',
          width: 480,
          height: 320,
        },
      ],
      content: spotContents[1],
      order: 2,
    },
  ],
  like_count: 24,
  is_liked: false,
  comment_count: 7,
  is_bookmarked: false,
  is_owner: false,
}

function buildPostDetail(postId: string): PostDetail {
  const itemIndex = ALL_FEED_ITEMS.findIndex((item) => item.post.post_id === postId)
  if (itemIndex === -1) return showcaseFallback

  const feedItem = ALL_FEED_ITEMS[itemIndex]

  const spotCount = feedItem.spots.length
  // 게시글마다 다른 spot에 썸네일이 배치되도록 itemIndex로 분산
  const thumbnailSpotIdx = itemIndex % spotCount

  const spots: Spot[] = feedItem.spots.map((s, j) => ({
    spot_id: s.spot_id,
    location: {
      place_name: s.location.place_name,
      address_name: s.location.address_name,
      road_address_name: s.location.road_address_name,
      x: s.location.x,
      y: s.location.y,
    },
    images: (() => {
      const imgCount = ((itemIndex * 3 + j * 7) % 5) + 1
      const sizes = ['480/320', '540/960', '800/800', '480/320', '540/960']
      const origSizes = ['960/640', '1080/1920', '1080/1080', '960/640', '1080/1920']
      const suffixes = ['', 'b', 'c', 'd', 'e']
      return Array.from({ length: imgCount }, (_, k) => {
        // img_url이 실제로 생성하는 크기와 일치시킨다 (썸네일은 항상 480/320)
        const [width, height] = sizes[k % sizes.length].split('/').map(Number)
        return {
          img_url: k === 0 && j === thumbnailSpotIdx
            ? feedItem.post.thumbnail
            : `https://picsum.photos/seed/post${itemIndex}spot${j}${suffixes[k]}/${sizes[k % sizes.length]}`,
          original_img: k === 0 && j === thumbnailSpotIdx
            ? feedItem.post.thumbnail.replace('/480/320', '/960/640')
            : `https://picsum.photos/seed/post${itemIndex}spot${j}${suffixes[k]}/${origSizes[k % origSizes.length]}`,
          img_order: k + 1,
          key: `mock/post${itemIndex}spot${j}${suffixes[k]}`,
          width,
          height,
        }
      })
    })(),
    content: spotContents[(itemIndex + j) % spotContents.length],
    order: s.order,
  }))

  return {
    post: {
      post_id: postId,
      title: titles[itemIndex % titles.length],
      description: feedItem.post.description,
      thumbnail: feedItem.post.thumbnail,
      thumbnail_width: 480,
      thumbnail_height: 320,
      created_at: '2026-05-28T11:45:00Z',
      updated_at: '2026-05-28T11:45:00Z',
    },
    user: {
      user_id: feedItem.user.user_id,
      nickname: feedItem.user.nickname,
      profile_img: feedItem.user.profile_img ?? '',
    },
    spots,
    like_count: feedItem.like_count,
    is_liked: likedPosts.has(postId),
    comment_count: getCommentCount(postId),
    is_bookmarked: bookmarkedPosts.has(postId),
    is_owner: false,
  }
}

const BOOKMARKS_PAGE_SIZE = 8

function buildBookmarkItem(postId: string): BookmarkListItem | null {
  const feedItem = ALL_FEED_ITEMS.find((item) => item.post.post_id === postId)
  if (!feedItem) return null
  return {
    post_id: feedItem.post.post_id,
    thumbnail: feedItem.post.thumbnail,
    description: feedItem.post.description,
    comment_count: getCommentCount(postId),
    is_liked: likedPosts.has(postId),
    like_count: postLikeCounts.get(postId) ?? feedItem.like_count,
  }
}

export const postsHandlers = [
  // 내 북마크 목록 — cursor 페이징 mock
  http.get('*/posts/bookmarks', ({ request }) => {
    if (!request.headers.get('Authorization')) {
      return HttpResponse.json(
        { error_detail: '인증되지 않은 사용자입니다.' },
        { status: 401 },
      )
    }
    const url = new URL(request.url)
    const cursor = url.searchParams.get('cursor')
    const start = cursor ? Number(cursor) : 0
    const end = start + BOOKMARKS_PAGE_SIZE

    const allIds = Array.from(bookmarkedPosts)
    const slice = allIds.slice(start, end)
    const results = slice
      .map(buildBookmarkItem)
      .filter((v): v is BookmarkListItem => v !== null)

    const hasMore = end < allIds.length
    const next = hasMore
      ? `${url.origin}${url.pathname}?cursor=${end}`
      : null

    const response: BookmarkListResponse = { next, results }
    return HttpResponse.json(response)
  }),

  http.get('*/posts/:postId', ({ params }) => {
    const postId = params.postId as string
    const detail = buildPostDetail(postId)
    return HttpResponse.json({
      ...detail,
      comment_count: getCommentCount(postId),
      is_liked: likedPosts.has(postId),
      is_bookmarked: bookmarkedPosts.has(postId),
      like_count: postLikeCounts.get(postId) ?? detail.like_count,
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

  // S3 presigned URL POST 요청 — CORS 우회용 mock
  http.post('https://*.s3.ap-northeast-2.amazonaws.com/*', () => {
    return new HttpResponse(null, { status: 200 })
  }),

  // ─────────────────────────────────────────────────────────────
  // 게시글 수정 / 삭제
  //
  // 백엔드 실제 API 개발 완료. 현재 등록은 index.ts에서 `...postsHandlers,`
  // 라인이 주석 처리되어 실서버 패스스루 상태. 활성화 시 mock 검증 가능.
  // ─────────────────────────────────────────────────────────────

  // 게시글 수정
  http.patch('*/posts/:postId', async ({ params, request }) => {
    if (!request.headers.get('Authorization')) {
      return HttpResponse.json(
        { error_detail: '인증되지 않은 사용자입니다.' },
        { status: 401 },
      )
    }
    const postId = params.postId as string
    if (postId === 'not-owner') {
      return HttpResponse.json(
        { error_detail: '본인 게시글만 수정할 수 있습니다.' },
        { status: 403 },
      )
    }
    if (postId === 'not-found') {
      return HttpResponse.json(
        { error_detail: '존재하지 않는 게시글입니다.' },
        { status: 404 },
      )
    }
    const body = (await request.json()) as Record<string, unknown>
    if (!body.title) {
      return HttpResponse.json(
        { error_detail: { title: ['이 필드는 필수 항목입니다.'] } },
        { status: 400 },
      )
    }
    return HttpResponse.json(
      { detail: '게시글이 수정되었습니다.' },
      { status: 200 },
    )
  }),

  // 게시글 삭제
  http.delete('*/posts/:postId', ({ params, request }) => {
    if (!request.headers.get('Authorization')) {
      return HttpResponse.json(
        { error_detail: '인증되지 않은 사용자입니다.' },
        { status: 401 },
      )
    }
    const postId = params.postId as string
    if (postId === 'not-owner') {
      return HttpResponse.json(
        { error_detail: '본인 게시글만 삭제할 수 있습니다.' },
        { status: 403 },
      )
    }
    if (postId === 'not-found') {
      return HttpResponse.json(
        { error_detail: '존재하지 않는 게시글입니다.' },
        { status: 404 },
      )
    }
    return HttpResponse.json(
      { detail: '게시글이 삭제되었습니다.' },
      { status: 200 },
    )
  }),
]
