"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MailX } from "lucide-react";
import { getCurrentUser, refreshToken } from "@/lib/api/auth";
import { useAuthStore, toAuthUser } from "@/store/authStore";
import { getApiErrorMessage } from "@/lib/apiError";
import { toast } from "@/store/toastStore";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/common";

const PROVIDER_LABELS: Record<string, string> = {
  kakao: "카카오",
  google: "구글",
};

export function SocialCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isSuccess = searchParams.get("is_success") === "true";
  const reason = searchParams.get("reason");
  const provider = searchParams.get("provider") ?? "";
  const isEmailExists = !isSuccess && reason === "email_exists";
  const providerLabel = PROVIDER_LABELS[provider] ?? "소셜";

  useEffect(() => {
    if (isEmailExists) {
      return;
    }

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
        useAuthStore.getState().setAuth(toAuthUser(me), access_token);
        router.replace("/");
      } catch (e) {
        toast.error(getApiErrorMessage(e, { client: "소셜 로그인에 실패했습니다. 다시 시도해주세요." }));
        router.replace("/login");
      }
    }

    handleCallback();
  // router는 Next.js가 안정적인 참조를 보장하므로 deps에 포함해도 무한 루프 없음
  }, [router, isSuccess, isEmailExists]);

  if (isEmailExists) {
    return (
      <div className="w-full max-w-sm bg-bg-card border border-border rounded-card shadow-sm p-8 flex flex-col items-center text-center">
        <MailX className="w-12 h-12 text-primary mb-4" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          이미 가입된 이메일입니다
        </h2>
        <p className="text-sm text-text-secondary mb-6">
          {providerLabel} 계정의 이메일로 이미 가입된 계정이 있습니다. 기존 계정으로 로그인해주세요.
        </p>
        <Button
          variant="primary"
          size="md"
          fullWidth
          onClick={() => router.push("/login")}
        >
          로그인 페이지로 이동
        </Button>
      </div>
    );
  }

  return <Spinner size="lg" />;
}
