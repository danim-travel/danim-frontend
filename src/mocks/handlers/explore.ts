/**
 * 탐색 피드 Mock 핸들러. cursor 기반 페이지네이션과 search 필터를 시뮬레이션한다.
 * GET v1/posts/explore?search=...&cursor=...&page_size=...
 */
import { http, HttpResponse } from 'msw'
import type { ExplorePost, ExploreResponse } from '@/types'
import { ALL_FEED_ITEMS } from './mainFeed'

const MOCK_TITLES = [
  '제주도 동쪽 드라이브 코스', '부산 해운대 야경 투어', '경주 문화유산 탐방',
  '강릉 커피거리 & 해변', '속초 청초호 산책 코스', '여수 밤바다 여행기',
  '전주 한옥마을 하루 일정', '남이섬 가을 단풍 나들이', '서울 북촌 골목 산책',
  '울릉도 1박 2일 코스', '통영 미륵산 케이블카', '안동 하회마을 문화 탐방',
  '거제도 바람의 언덕', '포항 호미곶 일출', '제주 서쪽 올레길',
  '부산 감천문화마을 산책', '경주 야간 개장 투어', '강릉 정동진 일출',
  '서울 한강 야경 크루즈', '인천 차이나타운 & 송월동', '수원 화성 성곽 걷기',
  '춘천 남이섬 & 김유정역', '전주 비빔밥 골목 탐방', '목포 유달산 케이블카',
  '여수 돌산도 해안 드라이브',
]

const MOCK_HEIGHTS = [320, 480, 260, 560, 400, 300, 520, 380, 440, 280, 500, 360, 420, 600, 340, 460, 240, 540, 390, 470, 310, 490, 350, 610, 430]

// ALL_FEED_ITEMS → ExplorePost 변환 (타이틀 포함한 검색용 내부 타입)
const EXPLORE_ITEMS = ALL_FEED_ITEMS.map((item, i) => ({
  post_id: item.post.post_id,
  thumbnail: `https://picsum.photos/seed/explore${i + 1}/480/${MOCK_HEIGHTS[i % MOCK_HEIGHTS.length]}`,
  like_count: item.like_count,
  comment_count: item.comment_count,
  _title: MOCK_TITLES[i % MOCK_TITLES.length],
  _description: item.post.description,
}))

export const exploreHandlers = [
  http.get('*/posts/explore', ({ request }) => {
    if (!request.headers.get('Authorization')) {
      return HttpResponse.json(
        { error_detail: '인증되지 않은 사용자입니다.' },
        { status: 401 },
      )
    }

    const url = new URL(request.url)
    const search = url.searchParams.get('search')?.toLowerCase().trim() ?? ''
    const cursorParam = url.searchParams.get('cursor')
    const pageSize = Number(url.searchParams.get('page_size') ?? '12')

    const filtered = search
      ? EXPLORE_ITEMS.filter(
          (item) => item._title.toLowerCase().includes(search) || item._description.toLowerCase().includes(search),
        )
      : EXPLORE_ITEMS

    const cursorIndex = cursorParam
      ? filtered.findIndex((item) => item.post_id === cursorParam)
      : -1
    const offset = cursorIndex + 1

    const sliced = filtered.slice(offset, offset + pageSize)
    const lastItem = sliced[sliced.length - 1]
    const hasNext = offset + pageSize < filtered.length

    const nextUrl = hasNext && lastItem
      ? `${url.origin}/posts/explore?cursor=${lastItem.post_id}${search ? `&search=${encodeURIComponent(search)}` : ''}`
      : null

    const results: ExplorePost[] = sliced.map(({ post_id, thumbnail, like_count, comment_count }) => ({
      post_id, thumbnail, like_count, comment_count,
    }))

    const response: ExploreResponse = { next: nextUrl, results }
    return HttpResponse.json(response)
  }),
]
