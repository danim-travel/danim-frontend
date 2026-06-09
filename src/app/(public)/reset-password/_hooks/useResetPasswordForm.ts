"use client";
import { useRouter } from "next/navigation";
import { useForm, useController } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EMAIL_PATTERN } from "../../_constants/emailValidation";
import { useEmailVerification } from "../../_hooks/useEmailVerification";
import { resetPassword } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/apiError";
import { toast } from "@/store/toastStore";
import { resetPasswordSchema, type ResetPasswordFormValues } from "../_schema";

export function useResetPasswordForm() {
  const router = useRouter();
  const {
    control,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
      emailToken: "",
      password: "",
      passwordConfirm: "",
    },
  });

  const { field: emailField } = useController({ control, name: "email" });
  const { field: passwordField } = useController({ control, name: "password" });
  const { field: passwordConfirmField } = useController({ control, name: "passwordConfirm" });

  // 이메일 형식이 아니면 "인증 요청" 버튼 비활성화
  const isEmailValid = EMAIL_PATTERN.test(emailField.value);

  const {
    code,
    setCode,
    codeSent,
    verified,
    requestLoading,
    confirmLoading,
    confirmError,
    requestVerify,
    confirmCode,
    resetVerification,
  } = useEmailVerification({
    // 인증 완료 시 백엔드가 발급한 email_token을 폼에 주입
    onVerified: (emailToken) => setValue("emailToken", emailToken, { shouldValidate: true }),
    purpose: "find_password",
  });

  // 인증 코드 필드 하단 메시지 색상: 완료=초록 / 에러=빨강 / 기본=회색
  function getCodeFieldTone() {
    if (verified) return "primary" as const;
    if (confirmError || errors.emailToken?.message) return "error" as const;
    return "muted" as const;
  }

  const onSubmit = handleSubmit(async (data) => {
    try {
      await resetPassword({
        email_token: data.emailToken,
        new_password: data.password,
      });
      toast.success("비밀번호가 재설정되었습니다. 로그인해주세요.");
      router.push("/login");
    } catch (e) {
      toast.error(getApiErrorMessage(e, { client: "비밀번호 재설정에 실패했습니다." }));
    }
  });

  return {
    emailField,
    passwordField,
    passwordConfirmField,
    errors,
    isSubmitting,
    isEmailValid,
    code,
    setCode,
    codeSent,
    verified,
    requestLoading,
    confirmLoading,
    confirmError,
    requestVerify,
    confirmCode,
    resetVerification,
    getCodeFieldTone,
    onSubmit,
  };
}
