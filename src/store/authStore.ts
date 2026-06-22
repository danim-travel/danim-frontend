/**
 * 인증 상태 스토어.
 * accessToken은 보안상 인메모리로만 유지하고, user 정보만 localStorage에 영속화한다.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CurrentUserResponse } from '@/types'

export type LoginType = 'email' | 'kakao' | 'google'

export interface AuthUser {
  userId: string
  nickname: string
  profileImg: string | null
  role: 'admin' | 'user' | 'not_verified'
  /** setAuth 시 access_token JWT payload에서 1회 추출. 렌더마다 파싱하지 않는다. */
  loginType: LoginType | null
}

/** access_token JWT payload에서 login_type을 추출한다. 파싱 실패 시 null 반환. */
function extractLoginType(accessToken: string): LoginType | null {
  try {
    const b64 = accessToken.split('.')[1]
    if (!b64) return null
    const norm = b64.replace(/-/g, '+').replace(/_/g, '/')
    const padded = norm.padEnd(norm.length + (4 - norm.length % 4) % 4, '=')
    const { login_type } = JSON.parse(atob(padded)) as { login_type?: string }
    if (login_type === 'email' || login_type === 'kakao' || login_type === 'google') return login_type
    return null
  } catch {
    return null
  }
}

/** CurrentUserResponse → AuthUser 변환. role 기본값 정규화를 단일 진입점에서 처리한다. */
export function toAuthUser(user: CurrentUserResponse): AuthUser {
  return {
    userId: user.user_id,
    nickname: user.nickname,
    profileImg: user.profile_img,
    role: user.role ?? 'not_verified',
    loginType: null, // setAuth에서 access_token 기반으로 덮어쓴다
  }
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  // 앱 초기 silent refresh가 끝나기 전에는 false. 이 값이 false인 동안 인증 상태로 라우팅을 판단하면
  // 로그인된 사용자가 비로그인으로 잘못 처리되어 /login으로 튕기는 문제가 생긴다.
  isHydrated: boolean
  setAuth: (user: AuthUser, accessToken: string) => void
  updateAuthUser: (patch: Partial<AuthUser>) => void
  setToken: (accessToken: string) => void
  clearAuth: () => void
  setHydrated: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isHydrated: false,
      setAuth: (user, accessToken) => set({ user: { ...user, loginType: extractLoginType(accessToken) }, accessToken }),
      updateAuthUser: (patch) => set((state) => ({
        user: state.user ? { ...state.user, ...patch } : null,
      })),
      setToken: (accessToken) => set({ accessToken }),
      clearAuth: () => set({ user: null, accessToken: null }),
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'auth-storage',
      // accessToken은 XSS 노출 위험이 있어 localStorage에 저장하지 않는다.
      // 새로고침 시에는 refresh_token(HttpOnly 쿠키) 기반 silent refresh로 복원한다.
      partialize: (state) => ({ user: state.user }),
    }
  )
)
