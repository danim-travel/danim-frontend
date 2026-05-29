import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z
    .string({ required_error: '값이 설정되지 않았습니다' })
    .url('올바른 URL 형식이 아닙니다'),
  NEXT_PUBLIC_KAKAO_MAP_KEY: z
    .string({ required_error: '값이 설정되지 않았습니다' })
    .min(1, '빈 값입니다'),
})

const result = envSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_KAKAO_MAP_KEY: process.env.NEXT_PUBLIC_KAKAO_MAP_KEY,
})

if (!result.success) {
  const messages = result.error.issues
    .map((i) => `  [${i.path[0]}] ${i.message}`)
    .join('\n')
  throw new Error(`환경변수 설정 오류:\n${messages}\n\n.env.local 파일을 확인하세요.`)
}

export const env = result.data
