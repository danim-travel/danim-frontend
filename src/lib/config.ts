/**
 * 환경변수 접근 단일 진입점.
 * 컴포넌트/라이브러리에서 process.env를 직접 참조하지 않고 이 파일을 통해서만 접근한다.
 * 실제 값은 src/lib/env.ts의 Zod 스키마에서 검증 후 주입된다.
 */
import { env } from './env'

export const config = {
  get apiUrl() {
    return env.NEXT_PUBLIC_API_URL
  },
  /**
   * WebSocket 베이스 URL. 끝의 슬래시 없이 origin 형태로 노출한다.
   * 예: `wss://dev-api.danim.kr`
   * 사용 측에서 `${config.wsBaseUrl}/ws/notifications/` 처럼 경로를 붙인다.
   */
  get wsBaseUrl() {
    return env.NEXT_PUBLIC_WS_URL.replace(/\/+$/, '')
  },
  get kakaoMapKey() {
    return env.NEXT_PUBLIC_KAKAO_MAP_KEY
  },
  get isDev() {
    return process.env.NODE_ENV === 'development'
  },
} as const
