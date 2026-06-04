/**
 * 인증 상태 스토어.
 * accessToken은 보안상 인메모리로만 유지하고, user 정보만 localStorage에 영속화한다.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthUser {
  userId: string
  nickname: string
  profileImg: string | null
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  // 앱 초기 silent refresh가 끝나기 전에는 false. 이 값이 false인 동안 인증 상태로 라우팅을 판단하면
  // 로그인된 사용자가 비로그인으로 잘못 처리되어 /login으로 튕기는 문제가 생긴다.
  isHydrated: boolean
  setAuth: (user: AuthUser, accessToken: string) => void
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
      setAuth: (user, accessToken) => set({ user, accessToken }),
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
