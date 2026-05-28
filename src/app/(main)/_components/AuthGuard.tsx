/**
 * 인증 보호 컴포넌트.
 * 기능 구현 완료 후 (main)/layout.tsx에서 children을 감싸는 용도로 적용 예정.
 */
'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const accessToken = useAuthStore((s) => s.accessToken)
  const isHydrated = useAuthStore((s) => s.isHydrated)

  // silent refresh가 끝나기 전(isHydrated=false)에는 redirect하지 않는다.
  // 그렇지 않으면 로그인된 사용자도 첫 렌더에서 /login으로 튕긴다.
  useEffect(() => {
    if (isHydrated && !accessToken) router.replace('/login')
  }, [isHydrated, accessToken, router])

  if (!isHydrated || !accessToken) return null

  return <>{children}</>
}
