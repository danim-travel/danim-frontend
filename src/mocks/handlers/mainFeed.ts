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

// 지역별 spot 그룹 — 같은 게시글의 spot은 동일 지역 내에서 선택
const REGION_SPOTS = [
  // 제주
  [
    { place_name: '성산일출봉', address_name: '제주특별자치도 서귀포시 성산읍 성산리 1', road_address_name: '제주특별자치도 서귀포시 성산읍 일출로 284-12', x: '126.94251800000000', y: '33.45816900000000' },
    { place_name: '섭지코지', address_name: '제주특별자치도 서귀포시 성산읍 신양리 38-1', road_address_name: '제주특별자치도 서귀포시 성산읍 섭지코지로 107', x: '126.92955600000000', y: '33.43996800000000' },
    { place_name: '우도', address_name: '제주특별자치도 제주시 우도면', road_address_name: '제주특별자치도 제주시 우도면 우도해안길', x: '126.95243600000000', y: '33.50321400000000' },
    { place_name: '천지연폭포', address_name: '제주특별자치도 서귀포시 천지동 667-7', road_address_name: '제주특별자치도 서귀포시 천지동 667-7', x: '126.55490700000000', y: '33.24882100000000' },
    { place_name: '한림공원', address_name: '제주특별자치도 제주시 한림읍 한림리 300', road_address_name: '제주특별자치도 제주시 한림읍 한림로 300', x: '126.26645900000000', y: '33.39395400000000' },
  ],
  // 부산
  [
    { place_name: '해운대해수욕장', address_name: '부산광역시 해운대구 우동', road_address_name: '부산광역시 해운대구 해운대해변로 264', x: '129.16035900000000', y: '35.15869800000000' },
    { place_name: '광안리해수욕장', address_name: '부산광역시 수영구 광안동', road_address_name: '부산광역시 수영구 광안해변로 219', x: '129.11867200000000', y: '35.15317400000000' },
    { place_name: '감천문화마을', address_name: '부산광역시 사하구 감천동', road_address_name: '부산광역시 사하구 감내2로 203', x: '129.01046100000000', y: '35.09757200000000' },
    { place_name: '태종대', address_name: '부산광역시 영도구 동삼동 산29-1', road_address_name: '부산광역시 영도구 전망로 24', x: '129.08474900000000', y: '35.05572800000000' },
    { place_name: '용두산공원', address_name: '부산광역시 중구 광복동2가 산1', road_address_name: '부산광역시 중구 용두산길 37-55', x: '129.03218200000000', y: '35.10113300000000' },
  ],
  // 경주
  [
    { place_name: '불국사', address_name: '경상북도 경주시 진현동 15-1', road_address_name: '경상북도 경주시 불국로 385', x: '129.33165400000000', y: '35.79024600000000' },
    { place_name: '석굴암', address_name: '경상북도 경주시 진현동 999', road_address_name: '경상북도 경주시 불국로 873-243', x: '129.34681600000000', y: '35.79470400000000' },
    { place_name: '첨성대', address_name: '경상북도 경주시 인왕동 839-1', road_address_name: '경상북도 경주시 첨성로 169-5', x: '129.21764200000000', y: '35.83484100000000' },
    { place_name: '안압지(동궁과 월지)', address_name: '경상북도 경주시 인왕동 26-1', road_address_name: '경상북도 경주시 원화로 102', x: '129.22706100000000', y: '35.83461100000000' },
    { place_name: '대릉원', address_name: '경상북도 경주시 황남동 255', road_address_name: '경상북도 경주시 계림로 9', x: '129.21426400000000', y: '35.83382100000000' },
  ],
  // 강릉
  [
    { place_name: '경포해변', address_name: '강원도 강릉시 저동', road_address_name: '강원도 강릉시 창해로 514', x: '128.90391900000000', y: '37.76959100000000' },
    { place_name: '오죽헌', address_name: '강원도 강릉시 죽헌동 201', road_address_name: '강원도 강릉시 율곡로 3139번길 24', x: '128.87529700000000', y: '37.74889200000000' },
    { place_name: '강릉중앙시장', address_name: '강원도 강릉시 성남동 50', road_address_name: '강원도 강릉시 금성로 21', x: '128.89867700000000', y: '37.75180400000000' },
    { place_name: '안목해변(커피거리)', address_name: '강원도 강릉시 견소동', road_address_name: '강원도 강릉시 창해로14번길 20', x: '128.92248100000000', y: '37.77116700000000' },
    { place_name: '정동진', address_name: '강원도 강릉시 강동면 정동진리', road_address_name: '강원도 강릉시 강동면 헌화로 990-1', x: '129.02295400000000', y: '37.68820800000000' },
  ],
  // 서울
  [
    { place_name: '경복궁', address_name: '서울특별시 종로구 세종로 1-1', road_address_name: '서울특별시 종로구 사직로 161', x: '126.97694700000000', y: '37.57960700000000' },
    { place_name: '북촌한옥마을', address_name: '서울특별시 종로구 가회동', road_address_name: '서울특별시 종로구 북촌로', x: '126.98533000000000', y: '37.58270000000000' },
    { place_name: '인사동', address_name: '서울특별시 종로구 인사동', road_address_name: '서울특별시 종로구 인사동길', x: '126.98548900000000', y: '37.57417300000000' },
    { place_name: '남산서울타워', address_name: '서울특별시 용산구 용산동2가 산1-3', road_address_name: '서울특별시 용산구 남산공원길 105', x: '126.98822200000000', y: '37.55134800000000' },
    { place_name: '광장시장', address_name: '서울특별시 종로구 예지동 6-1', road_address_name: '서울특별시 종로구 창경궁로 88', x: '126.99982400000000', y: '37.57012700000000' },
  ],
]

const descriptions = [
  '제주도 동쪽 코스 다녀왔어요!', '부산 여행 2박 3일 후기.',
  '경주 역사 유적지 탐방 코스.', '강릉 커피거리 & 해변 하루 코스.',
  '서울 종로 도보 여행 추천해요.', '제주 서쪽 드라이브 코스 공유.',
  '부산 맛집 & 야경 투어.', '경주 야간 개장 꿀팁 공유.',
  '강릉 정동진 일출 여행기.', '서울 궁궐 투어 반나절 코스.',
]

// 25개 — 마지막 페이지가 5개로 부분 채워지는 엣지 케이스 포함
export const ALL_FEED_ITEMS: MainFeedItem[] = Array.from({ length: 25 }, (_, i) => {
  const spotCount = (i % 5) + 1
  // 게시글 인덱스로 지역 고정 — 같은 게시글의 모든 spot은 동일 지역
  const regionSpots = REGION_SPOTS[i % REGION_SPOTS.length]
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
      spot_id: makeId('01SPOT', i * 5 + j + 1),
      location: regionSpots[j % regionSpots.length],
      order: j + 1,
    })),
    spot_count: spotCount,
    comment_count: 3,
    like_count: Math.max(1, (i * 7) % 50),
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
