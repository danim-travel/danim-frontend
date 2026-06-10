/**
 * 앱 전역 Provider 설정.
 * TanStack Query 클라이언트 + MSW 초기화 + 인증 부트스트랩(silent refresh)을 묶어서 제공한다.
 */
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { isApiError } from '@/lib/apiError'
import { refreshToken, getCurrentUser } from '@/lib/api/auth'
import { useAuthStore } from '@/store/authStore'
import { ToastProvider } from './ToastProvider'

async function initMsw() {
  if (process.env.NODE_ENV !== 'development') return
  if (typeof window === 'undefined') return
  const { worker } = await import('@/mocks/browser')
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { options: { updateViaCache: 'none' } },
  })
}

// 모듈 평가 시점에 즉시 실행 — Provider 컴포넌트 마운트보다 먼저 서비스 워커를 띄워서
// AuthBootstrap의 첫 refresh 요청이 MSW에 의해 가로채질 수 있도록 보장한다.
const mswReady = initMsw()

/**
 * 앱 진입 시 silent refresh를 시도해 인증 상태를 복원한다.
 * isHydrated가 false인 동안에는 children 대신 스피너를 보여줘서,
 * 로그인된 사용자가 비로그인 상태로 잘못 렌더링되어 라우팅이 튀는 것을 막는다.
 */
function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const isHydrated = useAuthStore((s) => s.isHydrated)

  useEffect(() => {
    const { setToken, setHydrated } = useAuthStore.getState()
    // MSW가 준비된 뒤에 refresh를 호출해야 mock 핸들러가 요청을 가로챌 수 있다.
    mswReady.catch(() => {}).then(async () => {
      try {
        const { access_token } = await refreshToken()
        // refreshToken 성공 시 즉시 저장 — getCurrentUser 실패해도 /login으로 튕기지 않음
        setToken(access_token)
        try {
          const me = await getCurrentUser()
          const { setAuth } = useAuthStore.getState()
          setAuth({ userId: me.user_id, nickname: me.nickname, profileImg: me.profile_img }, access_token)
        } catch {
          // getCurrentUser 실패 — 토큰은 유효하므로 유지, user는 null 상태로 진입
        }
      } catch {
        // refreshToken 실패 = 비로그인 상태 유지 (accessToken 이미 null)
      } finally {
        setHydrated()
      }
    })
  }, [])

  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: (failureCount, error) => {
              if (isApiError(error) && error.status === 401) return false
              return failureCount < 1
            },
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthBootstrap>{children}</AuthBootstrap>
      </ToastProvider>
    </QueryClientProvider>
  )
}
