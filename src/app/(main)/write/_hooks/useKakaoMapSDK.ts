'use client'

import { useState, useEffect } from 'react'
import { config } from '@/lib/config'
import { KAKAO_MAP_POLL_INTERVAL_MS } from '../_constants'

export function useKakaoMapSDK(): boolean {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // 언마운트 후 setReady가 호출되지 않도록 막는 플래그
    let alive = true

    const initPlaces = () => {
      if (!alive) return
      // autoload=false로 로드했으므로 kakao.maps.load()로 수동 초기화
      kakao.maps.load(() => {
        if (!alive) return
        setReady(true)
      })
    }

    // 이미 다른 컴포넌트가 SDK를 로드한 경우 바로 초기화
    if (typeof kakao !== 'undefined') {
      initPlaces()
      return () => {
        alive = false
      }
    }

    const src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${config.kakaoMapKey}&autoload=false&libraries=services`
    // 동일 src 스크립트가 이미 존재하면 재삽입 없이 재사용
    let script = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)

    if (!script) {
      script = document.createElement('script')
      script.src = src
      script.async = true
      document.head.appendChild(script)
    }

    // 스크립트 로드 완료 시점을 onload 대신 폴링으로 감지 — script.onload는 이미 로드된 경우 발화 안 함
    const poll = setInterval(() => {
      if (typeof kakao !== 'undefined') {
        clearInterval(poll)
        initPlaces()
      }
    }, KAKAO_MAP_POLL_INTERVAL_MS)

    return () => {
      alive = false
      clearInterval(poll)
    }
  }, [])

  return ready
}
