'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

interface AuthGuardProps {
  children: React.ReactNode
}

/**
 * 로그인이 필요한 페이지에서 개별적으로 사용하는 가드.
 * 비로그인 시 /login으로 리다이렉트한다.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const accessToken = useAuthStore((s) => s.accessToken)
  const isHydrated = useAuthStore((s) => s.isHydrated)

  useEffect(() => {
    if (isHydrated && !accessToken) {
      router.replace('/login')
    }
  }, [isHydrated, accessToken, router])

  if (!isHydrated) return null
  if (!accessToken) return null

  return <>{children}</>
}
