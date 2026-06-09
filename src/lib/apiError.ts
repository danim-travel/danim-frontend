// 백엔드 error_detail 필드 형태 두 가지
// - 문자열: "중복된 닉네임입니다."
// - 객체:   { nickname: ["닉네임은 필수 항목입니다."] } or { detail: "세션 만료" }
export type ApiErrorDetail = string | Record<string, string | string[]>

// API 에러 타입 — 기본 Error에 status(HTTP 상태코드)와 detail(에러 내용)을 추가
export type ApiError = Error & {
  readonly status: number
  readonly detail: ApiErrorDetail
}

// ApiError 객체 생성
// Object.assign을 쓰는 이유: new Error()로 만든 객체에 status, detail을 직접 추가할 수 없어서
// 기존 Error 객체에 속성을 합치는 방식으로 만듦
export function createApiError(status: number, detail: ApiErrorDetail): ApiError {
  return Object.assign(
    // detail이 문자열이면 그대로, 객체면 JSON 문자열로 변환해서 Error message에 넣음
    // (message는 실제로 쓰이지 않고 detail에서 메시지를 꺼냄)
    new Error(typeof detail === 'string' ? detail : JSON.stringify(detail)),
    { name: 'ApiError', status, detail }
  ) as ApiError
}

// 에러가 ApiError인지 판별
// 네 조건을 동시에 만족해야 true — createApiError로 만든 것만 실질적으로 통과
export function isApiError(error: unknown): error is ApiError {
  return (
    error instanceof Error &&
    error.name === 'ApiError' &&  // createApiError에서만 'ApiError'로 세팅됨
    'status' in error &&
    'detail' in error
  )
}

/**
 * 에러에서 토스트에 표시할 문자열을 추출한다.
 *
 * 적용 우선순위:
 * 1. 500대 → "서버 오류가 발생했습니다." 고정
 * 2. 그 외 → 백엔드 error_detail 메시지
 * 3. 백엔드 메시지 없을 때 → fallback.client (400·409·422 등에서 error_detail이 없는 예외 케이스)
 */
export function getApiErrorMessage(
  err: unknown,
  fallback: { client: string }
): string {
  if (isApiError(err)) {
    // 500대는 공통 문구로 고정
    if (err.status >= 500) return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'

    const { detail } = err

    // detail이 문자열이면 그대로 반환
    // 예: "유효하지 않은 토큰입니다."
    if (typeof detail === 'string' && detail) return detail

    if (typeof detail === 'object') {
      const first = Object.values(detail)[0] // 첫 번째 필드의 값

      // 값이 배열이면 첫 번째 요소 반환
      // 예: { nickname: ["닉네임은 필수 항목입니다."] } → "닉네임은 필수 항목입니다."
      if (Array.isArray(first) && first.length > 0) return first[0]

      // 값이 문자열이면 그대로 반환
      // 예: { detail: "로그인 세션이 만료되었습니다." } → "로그인 세션이 만료되었습니다."
      if (typeof first === 'string' && first) return first
    }

    // 백엔드 메시지를 못 꺼냈을 때 fallback
    return fallback.client
  }

  // ApiError가 아닌 경우 (네트워크 오류 등) → 서버 오류로 간주
  return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
}
