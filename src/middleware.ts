import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * 백엔드가 소셜 로그인 콜백을 /social-callback 대신 /로 리다이렉트하는 경우를 처리.
 * /?provider=...&is_success=...&reason=... → /social-callback?provider=...&is_success=...&reason=...
 */
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  if (pathname === '/' && searchParams.has('provider') && searchParams.has('is_success')) {
    const url = request.nextUrl.clone()
    url.pathname = '/social-callback'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|.*\\..*).*)'],
}
