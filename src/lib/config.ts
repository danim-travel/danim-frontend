/**
 * 환경변수 접근 단일 진입점.
 * 컴포넌트/라이브러리에서 process.env를 직접 참조하지 않고 이 파일을 통해서만 접근한다.
 * 실제 값은 src/lib/env.ts의 Zod 스키마에서 검증 후 주입된다.
 */
import { env } from './env'

export const config = {
  get apiUrl() {
    if (process.env.NODE_ENV === 'development') {
      // 실 백엔드가 필요한 경우: .env.local에 NEXT_PUBLIC_USE_REAL_API=true 추가
      // 기본값은 MSW 모드 — 상대 URL을 써야 SW(localhost:3000)가 요청을 인터셉트할 수 있다.
      if (process.env.NEXT_PUBLIC_USE_REAL_API === 'true') return env.NEXT_PUBLIC_API_URL
      return '/'
    }
    return env.NEXT_PUBLIC_API_URL
  },
  get kakaoMapKey() {
    return env.NEXT_PUBLIC_KAKAO_MAP_KEY
  },
  get isDev() {
    return process.env.NODE_ENV === 'development'
  },
} as const
