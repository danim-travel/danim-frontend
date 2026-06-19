'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

// 인증 상태와 무관하게 항상 렌더해야 하는 경로 (OAuth 콜백 등)
const EXEMPT_PATHS = ['/social-callback']

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const accessToken = useAuthStore((s) => s.accessToken)
  const isHydrated = useAuthStore((s) => s.isHydrated)

  const isExempt = EXEMPT_PATHS.some((p) => pathname.startsWith(p))

  useEffect(() => {
    if (isExempt) return
    if (isHydrated && accessToken) router.replace('/')
  }, [isHydrated, accessToken, router, isExempt])

  if (isExempt) return <>{children}</>
  if (!isHydrated || accessToken) return null

  return <>{children}</>
}
