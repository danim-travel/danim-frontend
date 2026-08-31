'use client'

import { useCallback, useState } from 'react'

export type Coords = {
  lat: number
  lng: number
}

/**
 * 지도가 알아낸 현재 위치 좌표를 보관한다.
 *
 * **이 훅은 `navigator.geolocation`을 직접 호출하지 않는다.**
 * `KakaoMap`이 이미 초기 마운트(지도 중심 이동)와 "현재위치" 버튼 두 군데서
 * 위치를 요청하고 있어서, 여기서 한 번 더 부르면 권한 프롬프트와 요청이 중복된다.
 * 대신 `KakaoMap`의 `onLocationResolved`가 올려주는 좌표를 받아 단일 소스로 삼는다.
 */
export function useCurrentPosition() {
  const [coords, setCoords] = useState<Coords | null>(null)

  // KakaoMap에 콜백으로 내려가므로 참조가 매 렌더 바뀌지 않아야 한다.
  const handleLocationResolved = useCallback((next: Coords) => {
    setCoords((prev) =>
      prev && prev.lat === next.lat && prev.lng === next.lng ? prev : next,
    )
  }, [])

  return { coords, handleLocationResolved }
}
