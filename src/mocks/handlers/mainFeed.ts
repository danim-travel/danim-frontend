/**
 * 메인(팔로잉) 피드 Mock 핸들러. 커서 기반 페이지네이션을 시뮬레이션한다.
 * GET v1/posts/main?cursor=...&page_size=...
 */
import { http, HttpResponse } from 'msw'
import type { MainFeedItem, MainFeedResponse } from '@/types'

// ULID 형태의 더미 ID 생성 (정확한 ULID는 아님, mock 용)
const makeId = (prefix: string, i: number) =>
  `mock_${prefix}_${String(i).padStart(3, '0')}`

const nicknames = [
  '다님이', 'traveler_kim', 'jeju_lover', 'seoul_wanderer', 'alps_hiker',
  'road_tripper', 'yh_explorer', 'busan_foodie', 'sokcho_diver', 'gyeongju_walker',
]

const descriptions = [
  '제주도 여행 후기입니다.', '부산 해운대 야경 정말 멋졌어요!', '경주 불국사에서 보낸 하루.',
  '강릉 커피거리 투어 다녀왔어요.', '속초 청초호 산책 코스 추천합니다.',
  '여수 밤바다 다녀왔어요. 강추!', '전주 한옥마을에서의 하루 일정 공유.',
  '남이섬 가을 단풍 정말 예뻐요.', '서울 북촌 한옥마을 산책.', '울릉도 1박 2일 여행 코스 정리.',
]

const mockSpots = [
  { place_name: '성산일출봉', address_name: '제주특별자치도 서귀포시 성산읍 성산리 1', road_address_name: '제주특별자치도 서귀포시 성산읍 일출로 284-12', x: '126.94251800000000', y: '33.45816900000000' },
  { place_name: '해운대해수욕장', address_name: '부산광역시 해운대구 우동', road_address_name: '부산광역시 해운대구 해운대해변로 264', x: '129.16035900000000', y: '35.15869800000000' },
  { place_name: '불국사', address_name: '경상북도 경주시 진현동 15-1', road_address_name: '경상북도 경주시 불국로 385', x: '129.33165400000000', y: '35.79024600000000' },
  { place_name: '경포해변', address_name: '강원도 강릉시 저동', road_address_name: '강원도 강릉시 창해로 514', x: '128.90391900000000', y: '37.76959100000000' },
  { place_name: '청초호', address_name: '강원도 속초시 조양동', road_address_name: '강원도 속초시 청초호반로 146', x: '128.59371300000000', y: '38.19849000000000' },
]

// 25개 — 마지막 페이지가 5개로 부분 채워지는 엣지 케이스 포함
const ALL_FEED_ITEMS: MainFeedItem[] = Array.from({ length: 25 }, (_, i) => {
  const spotCount = (i % 3) + 1
  return {
    user: {
      user_id: makeId('01JWNZ8KQE4VXRM2P7HFGB', i + 1),
      nickname: nicknames[i % nicknames.length],
      profile_img: `https://picsum.photos/seed/feeduser${i + 1}/100/100`,
    },
    post: {
      post_id: makeId('01JWPK3N8XQVHM4F2R9BDYC', i + 1),
      thumbnail: `https://picsum.photos/seed/feedpost${i + 1}/480/320`,
      description: descriptions[i % descriptions.length],
    },
    spots: Array.from({ length: spotCount }, (_, j) => ({
      spot_id: makeId('01SPOT', i * 3 + j + 1),
      location: mockSpots[(i + j) % mockSpots.length],
      order: j + 1,
    })),
    spot_count: spotCount,
    comment_count: (i * 3) % 17,
    like_count: (i * 7) % 50,
    is_liked: i % 4 === 0,
    is_bookmarked: i % 5 === 0,
  }
})

export const mainFeedHandlers = [
  http.get('*/posts/main', ({ request }) => {
    if (!request.headers.get('Authorization')) {
      return HttpResponse.json(
        { error_detail: '인증되지 않은 사용자입니다.' },
        { status: 401 },
      )
    }

    const PAGE_SIZE = 10
    const url = new URL(request.url)
    const cursorParam = url.searchParams.get('cursor')

    // cursor = 마지막으로 받은 post_id. 없으면 처음부터
    const cursorIndex = cursorParam
      ? ALL_FEED_ITEMS.findIndex((item) => item.post.post_id === cursorParam)
      : -1
    const offset = cursorIndex + 1

    const sliced = ALL_FEED_ITEMS.slice(offset, offset + PAGE_SIZE)
    const lastItem = sliced[sliced.length - 1]
    const hasNext = offset + PAGE_SIZE < ALL_FEED_ITEMS.length

    const nextUrl = hasNext && lastItem
      ? `${url.origin}/posts/main?cursor=${lastItem.post.post_id}`
      : null

    const response: MainFeedResponse = {
      next: nextUrl,
      results: sliced,
    }

    return HttpResponse.json(response)
  }),
]
