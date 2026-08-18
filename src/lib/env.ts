import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z
    .string({ required_error: '값이 설정되지 않았습니다' })
    .url('올바른 URL 형식이 아닙니다'),
  NEXT_PUBLIC_WS_URL: z
    .string({ required_error: '값이 설정되지 않았습니다' })
    .regex(/^wss?:\/\//, 'ws:// 또는 wss:// 로 시작해야 합니다'),
  NEXT_PUBLIC_KAKAO_MAP_KEY: z
    .string({ required_error: '값이 설정되지 않았습니다' })
    .min(1, '빈 값입니다'),
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url('올바른 URL 형식이 아닙니다')
    .optional()
    .default('http://localhost:3000'),
  // 개발 환경에서 MSW(목 서버) 사용 여부. 'disabled'면 실제 백엔드에 붙는다.
  // 미설정 시 기존 동작(개발 환경에서 MSW 사용)을 유지한다.
  NEXT_PUBLIC_API_MOCKING: z.enum(['enabled', 'disabled']).optional().default('enabled'),
})

const result = envSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  NEXT_PUBLIC_KAKAO_MAP_KEY: process.env.NEXT_PUBLIC_KAKAO_MAP_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_API_MOCKING: process.env.NEXT_PUBLIC_API_MOCKING,
})

if (!result.success) {
  const messages = result.error.issues
    .map((i) => `  [${i.path[0]}] ${i.message}`)
    .join('\n')
  throw new Error(`환경변수 설정 오류:\n${messages}\n\n.env.local 파일을 확인하세요.`)
}

export const env = result.data
