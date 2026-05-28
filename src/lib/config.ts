/**
 * 환경변수 접근 단일 진입점.
 * 컴포넌트/라이브러리에서 process.env를 직접 참조하지 않고 이 파일을 통해서만 접근한다.
 */
export const config = {
  get apiUrl() {
    const url = process.env.NEXT_PUBLIC_API_URL
    if (!url) throw new Error('NEXT_PUBLIC_API_URL이 설정되지 않았습니다. .env.local을 확인하세요.')
    return url
  },
  get kakaoMapKey() {
    const key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY
    if (!key) throw new Error('NEXT_PUBLIC_KAKAO_MAP_KEY가 설정되지 않았습니다. .env.local을 확인하세요.')
    return key
  },
} as const
