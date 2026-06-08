"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, TextField, PasswordField } from "@/components/common";
import { login, getMe } from "@/lib/api/auth";
import { useAuthStore } from "@/store/authStore";
import { isApiError } from "@/lib/apiClient";
import { toast } from "@/store/toastStore";
import { config } from "@/lib/config";
import { PASSWORD_RULES } from "../../_constants/passwordValidation";

const loginSchema = z.object({
  email: z.string().min(1, "이메일을 입력해주세요").email("올바른 이메일 형식이 아닙니다"),
  password: z
    .string()
    .min(1, "비밀번호를 입력해주세요")
    .max(PASSWORD_RULES.maxLength, `${PASSWORD_RULES.maxLength}자 이하여야 합니다`),
});
type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  function handleSocialLogin(provider: "kakao" | "google") {
    window.location.href = `${config.apiUrl}v1/auth/${provider}/login`;
  }

  const onSubmit = handleSubmit(async (data) => {
    try {
      const { access_token } = await login(data);
      useAuthStore.getState().setToken(access_token);
      const me = await getMe();
      useAuthStore.getState().setAuth(
        { userId: me.user_id, nickname: me.nickname, profileImg: me.profile_img },
        access_token
      );
      router.push("/");
    } catch (e) {
      if (isApiError(e)) {
        toast.error(typeof e.detail === "string" ? e.detail : "이메일 또는 비밀번호를 확인해주세요.");
      } else {
        toast.error("로그인에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
    }
  });

  return (
    <>
      {/* 소셜 로그인 — 공식 브랜드 색상(#FEE500 등)은 디자인 토큰 대상이 아님 */}
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="secondary"
          fullWidth
          className="h-[52px] text-base font-bold bg-[#FEE500] text-[#191600] border-none shadow-none hover:opacity-90"
          onClick={() => handleSocialLogin("kakao")}
        >
          카카오톡으로 계속하기
        </Button>
        <Button
          type="button"
          variant="secondary"
          fullWidth
          className="h-[52px] text-base bg-bg-subtle text-text hover:bg-bg"
          onClick={() => handleSocialLogin("google")}
        >
          Google로 계속하기
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <span className="flex-1 h-px bg-border" />
        <span className="text-caption text-text-muted whitespace-nowrap">또는 이메일로 로그인</span>
        <span className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <TextField
          label="이메일"
          type="email"
          placeholder="이메일 주소를 입력하세요"
          autoComplete="email"
          {...register("email")}
          error={errors.email?.message}
        />
        <div className="flex flex-col gap-2">
          <PasswordField
            label="비밀번호"
            placeholder="비밀번호를 입력하세요"
            autoComplete="current-password"
            maxLength={PASSWORD_RULES.maxLength}
            {...register("password")}
            error={errors.password?.message}
          />
          <div className="flex justify-end">
            <Link
              href="/reset-password"
              className="text-caption font-semibold text-primary-hover hover:underline"
            >
              비밀번호를 잊으셨나요?
            </Link>
          </div>
        </div>
        <Button type="submit" fullWidth className="h-[52px] text-base" disabled={isSubmitting}>
          {isSubmitting ? "로그인 중..." : "로그인"}
        </Button>
      </form>
    </>
  );
}

export default LoginForm;
