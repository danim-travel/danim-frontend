"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, TextField, PasswordField } from "@/components/common";
import { login, getCurrentUser } from "@/lib/api/auth";
import { useAuthStore } from "@/store/authStore";
import { getApiErrorMessage } from "@/lib/apiError";
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
    window.location.href = `${config.apiUrl}users/social-login/${provider}`;
  }

  const onSubmit = handleSubmit(async (data) => {
    try {
      // 1단계: 로그인 → access_token 발급
      const { access_token } = await login(data);
      useAuthStore.getState().setToken(access_token);
      // 2단계: 유저 정보 조회 → 전체 인증 상태 설정
      const me = await getCurrentUser();
      useAuthStore.getState().setAuth(
        { userId: me.user_id, nickname: me.nickname, profileImg: me.profile_img },
        access_token
      );

      router.push("/");
    } catch (e) {
      useAuthStore.getState().clearAuth();
      toast.error(getApiErrorMessage(e, { client: "이메일 또는 비밀번호를 확인해주세요." }));
    }
  });

  return (
    <>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="secondary"
          fullWidth
          className="h-[52px] text-base font-bold bg-kakao text-kakao-fg border-none shadow-none hover:bg-kakao hover:brightness-90"
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

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
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
