"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCurrentUser, refreshToken } from "@/lib/api/auth";
import { useAuthStore } from "@/store/authStore";
import { getApiErrorMessage } from "@/lib/apiError";
import { toast } from "@/store/toastStore";

export function SocialCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const isSuccess = searchParams.get("is_success") === "true";

    if (!isSuccess) {
      toast.error("소셜 로그인에 실패했습니다. 다시 시도해주세요.");
      router.replace("/login");
      return;
    }

    async function handleCallback() {
      try {
        const { access_token } = await refreshToken();
        useAuthStore.getState().setToken(access_token);
        const me = await getCurrentUser();
        useAuthStore.getState().setAuth(
          { userId: me.user_id, nickname: me.nickname, profileImg: me.profile_img },
          access_token
        );
        router.replace("/");
      } catch (e) {
        toast.error(getApiErrorMessage(e, { client: "소셜 로그인에 실패했습니다. 다시 시도해주세요." }));
        router.replace("/login");
      }
    }

    handleCallback();
  // router, searchParams는 Next.js가 안정적인 참조를 보장하므로 deps에 포함해도 무한 루프 없음
  }, [router, searchParams]);

  return (
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  );
}
