"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Spinner } from "@/components/ui/spinner";

interface Props {
  postId: string;
  children: React.ReactNode;
}

/**
 * 로그인 사용자가 공유 URL(/posts/[id])로 진입하면 메인 모달(/?post=...)로 리다이렉트.
 * silent refresh 완료(`isHydrated`) 후 인증 상태가 확정되기 전까지는
 * 게스트 뷰를 노출하지 않고 로딩 스피너를 보여 UX 깜빡임을 마스킹한다.
 */
export default function AuthRedirect({ postId, children }: Props) {
  const isLoggedIn = useAuthStore((s) => !!s.accessToken);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && isLoggedIn) {
      router.replace(`/?post=${postId}`);
    }
  }, [isHydrated, isLoggedIn, postId, router]);

  if (!isHydrated || (isHydrated && isLoggedIn)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <Spinner size="lg" />
      </div>
    );
  }
  return <>{children}</>;
}
