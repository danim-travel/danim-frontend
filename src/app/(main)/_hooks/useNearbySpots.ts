'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { queryKeys } from '@/lib/queryKeys'
import type { NearPostSpot, NearUserResponse } from '@/types'
import type { Coords } from './useCurrentPosition'

/** 칩 캐러셀이 감당할 수 있는 개수. 백엔드 상한이 확인되면 조정한다. */
const MAX_SPOTS = 10

/** 좌표 정밀도. 3자리 ≈ 110m — 이보다 잘게 나누면 캐시가 사실상 무의미해진다. */
const COORD_PRECISION = 3

function round(value: number): number {
  const factor = 10 ** COORD_PRECISION
  return Math.round(value * factor) / factor
}

/**
 * 내 위치 주변에 기록이 남은 장소 목록.
 *
 * 부가 기능이므로 에러가 나도 화면에 아무것도 띄우지 않는다.
 * 호출부는 `spots`가 비었는지만 보고 렌더 여부를 정한다.
 */
export function useNearbySpots(coords: Coords | null, enabled: boolean) {
  const rounded = coords ? { lat: round(coords.lat), lng: round(coords.lng) } : null

  const { data, isLoading } = useQuery({
    queryKey: rounded ? queryKeys.posts.nearby(rounded.lat, rounded.lng) : queryKeys.disabled,
    queryFn: async () => {
      // enabled 가드 때문에 실제로는 도달하지 않는다. 캐스팅 대신 좁히기 위한 분기.
      if (!rounded) return { top_near: [] } satisfies NearUserResponse
      return apiClient
        .get('posts/nearspots/user', {
          searchParams: { latitude: rounded.lat, longitude: rounded.lng },
        })
        .json<NearUserResponse>()
    },
    enabled: enabled && rounded !== null,
    // 몇 걸음 움직였다고 다시 부를 필요는 없다.
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  })

  // 참조가 매 렌더 바뀌면 지도 오버레이 이펙트가 계속 다시 돈다.
  const spots: NearPostSpot[] = useMemo(
    () => data?.top_near.slice(0, MAX_SPOTS) ?? [],
    [data],
  )

  return { spots, isLoading }
}
