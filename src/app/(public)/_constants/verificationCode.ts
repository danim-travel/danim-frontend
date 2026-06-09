export const VERIFICATION_CODE_LENGTH = 6

/** 인증 코드 입력값에서 숫자만 추출하고 최대 자릿수로 자른다. */
export function sanitizeVerificationCode(value: string): string {
  return value.replace(/\D/g, '').slice(0, VERIFICATION_CODE_LENGTH)
}
