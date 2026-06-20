'use client'

const SOCIAL_LOGIN_TYPES = ['kakao', 'google'] as const

/**
 * access_token JWT payload의 login_type 필드를 파싱한다.
 * 디코딩 실패 시 null을 반환하며, 호출 측에서는 email 흐름으로 폴백한다.
 */
function getLoginType(accessToken: string): string | null {
  try {
    const [, payloadB64] = accessToken.split('.')
    if (!payloadB64) return null
    // base64url → base64: 문자 치환 후 누락된 패딩(=) 복원
    const base64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=')
    const json = atob(padded)
    const payload = JSON.parse(json) as { login_type?: string }
    return payload.login_type ?? null
  } catch {
    return null
  }
}

/** 소셜(kakao/google) 로그인 여부. 디코딩 실패 시 false를 반환해 email 흐름을 유지한다. */
export function isSocialLoginToken(accessToken: string | null): boolean {
  if (!accessToken) return false
  const loginType = getLoginType(accessToken)
  return SOCIAL_LOGIN_TYPES.includes(loginType as (typeof SOCIAL_LOGIN_TYPES)[number])
}
