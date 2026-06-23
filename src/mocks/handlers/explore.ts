/**
 * 탐색 피드 Mock 핸들러. GET /api/v1/explore
 *
 * - 검색 모드(search 있음): cursor = post_id 기반 Base64 cursor. seed 미사용.
 * - 추천 피드 모드(search 없음): cursor = page number(int). seed로 무작위 정렬 고정.
 *
 * 두 모드 모두 8도 지역(category) 필터를 함께 적용한다.
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

const MOCK_HEIGHTS = [320, 480, 260, 560, 400, 300, 520, 380, 440, 280, 500, 360, 420, 600, 340, 460, 240, 540, 390, 470, 310, 490, 350, 610, 430]

// 게시글에 저장된 지역 값(spot 주소의 시/도)을 탐색 버튼의 8도 분류로 매핑.
// 작성 시 별도 지역 필드 없이 spot location(주소)만 저장되므로 주소를 기준으로 도출한다.
function addressToRegion(address: string): string {
  if (address.startsWith('서울')) return '서울'
  if (address.startsWith('경기') || address.startsWith('인천')) return '경기'
  if (address.startsWith('강원')) return '강원'
  if (address.startsWith('충청') || address.startsWith('충북') || address.startsWith('충남') || address.startsWith('대전') || address.startsWith('세종')) return '충청'
  if (address.startsWith('전라') || address.startsWith('전북') || address.startsWith('전남') || address.startsWith('광주')) return '전라'
  if (
    address.startsWith('경상') ||
    address.startsWith('경북') ||
    address.startsWith('경남') ||
    address.startsWith('부산') ||
    address.startsWith('대구') ||
    address.startsWith('울산')
  ) return '경상'
  if (address.startsWith('제주')) return '제주'
  return ''
}

// ALL_FEED_ITEMS → ExplorePost 변환. _region은 게시글 첫 spot 주소로 도출한 지역(필터용),
// _spots은 장소 검색용 내부 필드.
const EXPLORE_ITEMS = ALL_FEED_ITEMS.map((item, i) => ({
  post_id: item.post.post_id,
  thumbnail: `https://picsum.photos/seed/feedpost${i + 1}/480/${MOCK_HEIGHTS[i % MOCK_HEIGHTS.length]}`,
  like_count: item.like_count,
  comment_count: item.comment_count,
  _region: addressToRegion(item.spots[0]?.location.address_name ?? ''),
  // 장소명(place_name) + 주소(address_name) 합산 — "성수", "홍대" 같은 주소 기반 검색 지원
  _spots: item.spots
    .flatMap(s => [s.location.place_name, s.location.address_name])
    .filter(Boolean)
    .join(' ')
    .toLowerCase(),
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

    // 8도 지역 필터 — 게시글에 저장된 지역(spot 주소 기준)으로 필터. category 없으면 전체. 두 모드 공통
    const matchesCategory = (item: (typeof EXPLORE_ITEMS)[number]) =>
      !category || item._region === category

    const categoryQuery = category ? `&category=${encodeURIComponent(category)}` : ''

    // ── 검색 모드: post_id 기반 Base64 cursor ──────────────────────────────
    if (search) {
      const filtered = EXPLORE_ITEMS.filter((item) => {
        // 장소 정보(place_name + address_name)만 검색 대상 — "성수", "해운대" 등
        const matchesSearch = item._spots.includes(search)
        return matchesSearch && matchesCategory(item)
      })

      // cursor = 마지막으로 받은 post_id의 Base64 인코딩. 디코딩 후 그 다음부터 슬라이스
      let afterId: string | null = null
      try {
        afterId = cursorParam ? atob(cursorParam) : null
      } catch {
        // 잘못된 Base64 cursor → 첫 페이지로 처리
      }
      const afterIndex = afterId ? filtered.findIndex((item) => item.post_id === afterId) : -1

      // cursor의 post_id가 현재 결과에 없으면(검색어/필터 변경 등) 첫 페이지로 리셋되어
      // 무한 반복될 수 있으므로, 끝에 도달한 것으로 간주해 빈 페이지로 종료한다.
      if (afterId && afterIndex === -1) {
        return HttpResponse.json({ next: null, results: [] } satisfies ExploreResponse)
      }

      const offset = afterIndex + 1
      const sliced = filtered.slice(offset, offset + pageSize)
      const lastItem = sliced[sliced.length - 1]
      const hasNext = offset + pageSize < filtered.length

      const nextUrl = hasNext && lastItem
        ? `${url.origin}/explore?search=${encodeURIComponent(search)}${categoryQuery}&cursor=${encodeURIComponent(btoa(lastItem.post_id))}`
        : null

      const results: ExplorePost[] = sliced.map(({ post_id, thumbnail, like_count, comment_count }) => ({
        post_id, thumbnail, like_count, comment_count,
      }))

      const response: ExploreResponse = { next: nextUrl, results }
      return HttpResponse.json(response)
    }

    // ── 추천 피드 모드: page number(int) cursor + seed로 무작위 정렬 고정 ──
    const seed = seedParam ? Number(seedParam) : Math.floor(Math.random() * 2 ** 31)
    const page = cursorParam ? Number(cursorParam) : 1

    const filtered = seededShuffle(EXPLORE_ITEMS, seed).filter(matchesCategory)
    const offset = (page - 1) * pageSize
    const sliced = filtered.slice(offset, offset + pageSize)
    const hasNext = offset + pageSize < filtered.length

    const nextUrl = hasNext
      ? `${url.origin}/explore?cursor=${page + 1}&seed=${seed}${categoryQuery}`
      : null

    const results: ExplorePost[] = sliced.map(({ post_id, thumbnail, like_count, comment_count }) => ({
      post_id, thumbnail, like_count, comment_count,
    }))

    const response: ExploreResponse = { next: nextUrl, seed, results }
    return HttpResponse.json(response)
  }),
]
