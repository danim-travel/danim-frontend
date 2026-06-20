/**
 * 탐색 피드 Mock 핸들러. cursor 기반 페이지네이션과 search 필터를 시뮬레이션한다.
 * GET v1/posts/explore?search=...&cursor=...&seed=...&page_size=...
 */
import { http, HttpResponse } from 'msw'
import type { ExplorePost, ExploreResponse } from '@/types'
import { ALL_FEED_ITEMS } from './mainFeed'

// seed로 매 페이지 동일한 랜덤 순서를 재현하기 위한 결정론적 PRNG
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const random = mulberry32(seed)
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

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

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  서울: ['서울', '북촌', '한강'],
  경기: ['수원', '인천', '남이섬'],
  강원: ['강릉', '속초', '춘천', '정동진'],
  충청: ['충청', '천안', '공주'],
  전라: ['전주', '여수', '목포'],
  경상: ['부산', '경주', '통영', '안동', '거제', '포항', '울릉도'],
  제주: ['제주'],
}

// ALL_FEED_ITEMS → ExplorePost 변환 (타이틀 포함한 검색용 내부 타입)
const EXPLORE_ITEMS = ALL_FEED_ITEMS.map((item, i) => ({
  post_id: item.post.post_id,
  thumbnail: `https://picsum.photos/seed/feedpost${i + 1}/480/${MOCK_HEIGHTS[i % MOCK_HEIGHTS.length]}`,
  like_count: item.like_count,
  comment_count: item.comment_count,
  _title: MOCK_TITLES[i % MOCK_TITLES.length],
  _description: item.post.description,
}))

export const exploreHandlers = [
  http.get('*/explore', ({ request }) => {
    if (!request.headers.get('Authorization')) {
      return HttpResponse.json(
        { error_detail: '인증되지 않은 사용자입니다.' },
        { status: 401 },
      )
    }

    const url = new URL(request.url)
    const search = url.searchParams.get('search')?.toLowerCase().trim() ?? ''
    const category = url.searchParams.get('category') ?? ''
    const cursorParam = url.searchParams.get('cursor')
    const seedParam = url.searchParams.get('seed')
    const pageSize = Number(url.searchParams.get('page_size') ?? '12')
    const seed = seedParam ? Number(seedParam) : Math.floor(Math.random() * 2 ** 31)

    const keywords = category ? CATEGORY_KEYWORDS[category] ?? [] : []
    const filtered = seededShuffle(EXPLORE_ITEMS, seed).filter((item) => {
      const titleLower = item._title.toLowerCase()
      const matchesSearch = !search || titleLower.includes(search) || item._description.toLowerCase().includes(search)
      const matchesCategory = keywords.length === 0 || keywords.some((kw) => titleLower.includes(kw.toLowerCase()))
      return matchesSearch && matchesCategory
    })

    const cursorIndex = cursorParam
      ? filtered.findIndex((item) => item.post_id === cursorParam)
      : -1
    const offset = cursorIndex + 1

    const sliced = filtered.slice(offset, offset + pageSize)
    const lastItem = sliced[sliced.length - 1]
    const hasNext = offset + pageSize < filtered.length

    const nextUrl = hasNext && lastItem
      ? `${url.origin}/explore?cursor=${lastItem.post_id}&seed=${seed}${search ? `&search=${encodeURIComponent(search)}` : ''}${category ? `&category=${encodeURIComponent(category)}` : ''}`
      : null

    const results: ExplorePost[] = sliced.map(({ post_id, thumbnail, like_count, comment_count }) => ({
      post_id, thumbnail, like_count, comment_count,
    }))

    const response: ExploreResponse = { next: nextUrl, seed, results }
    return HttpResponse.json(response)
  }),
]
