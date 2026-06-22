/**
 * localStorage의 user와 인메모리 accessToken이 어긋난 경우를 복구하는 훅.
 * userId가 없고 accessToken이 있을 때 getCurrentUser()로 user를 재복원하며,
 * 실패 시 clearAuth() 후 fallback 메시지를 반환한다.
 *
 * mypage, followers 등 인증이 필요한 페이지에서 공통으로 사용한다.
 */
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { getCurrentUser } from "@/lib/api/auth";
import { toAuthUser } from "@/store/authStore";

interface UseAuthHydrationFallbackResult {
  /** user 복원 실패 시 표시할 메시지. 복원 중이거나 성공 시 null. */
  authFallbackMessage: string | null;
}

export function useAuthHydrationFallback(): UseAuthHydrationFallbackResult {
  const userId = useAuthStore((s) => s.user?.userId);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [authFallbackMessage, setAuthFallbackMessage] = useState<string | null>(null);

  useEffect(() => {
    if (userId || !accessToken) return;

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setAuthFallbackMessage(null);
    });

    getCurrentUser()
      .then((me) => {
        if (cancelled) return;
        setAuth(toAuthUser(me), accessToken);
      })
      .catch(() => {
        if (cancelled) return;
        clearAuth();
        setAuthFallbackMessage("로그인이 필요합니다.");
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, clearAuth, setAuth, userId]);

  return { authFallbackMessage };
}
