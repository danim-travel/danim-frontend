"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { publicClient, apiClient } from "@/lib/apiClient";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";
import type { MeResponse } from "@/types";

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
        const { access_token } = await publicClient
          .post("v1/users/me/refresh")
          .json<{ access_token: string }>();
        useAuthStore.getState().setToken(access_token);
        const me = await apiClient.get("v1/users/me").json<MeResponse>();
        useAuthStore.getState().setAuth(
          { userId: me.user_id, nickname: me.nickname, profileImg: me.profile_img },
          access_token
        );
        router.replace("/");
      } catch {
        toast.error("소셜 로그인에 실패했습니다. 다시 시도해주세요.");
        router.replace("/login");
      }
    }

    handleCallback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  );
}
