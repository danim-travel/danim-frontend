"use client";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/common";
import { signup } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/apiError";
import { toast } from "@/store/toastStore";
import { AccountSection } from "./AccountSection";
import { ProfileSection } from "./ProfileSection";
import { signupSchema, type RegisterFormValues } from "../_schema";

export function RegisterForm() {
  const router = useRouter();
  const methods = useForm<RegisterFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      emailToken: "",
      password: "",
      passwordConfirm: "",
      nickname: "",
      name: "",
      birthYear: "",
      birthMonth: "",
      birthDay: "",
    },
  });

  // 폼 제출 시 유효성 검사 실행 후 콜백 호출하는 함수
  // onSubmit 비동기 함수가 실행 중인 동안 true → 버튼 비활성화에 사용
  const { handleSubmit, formState: { isSubmitting } } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const birthDate = `${data.birthYear}-${data.birthMonth.padStart(2, "0")}-${data.birthDay.padStart(2, "0")}`;
      await signup({
        email_token: data.emailToken,
        password: data.password,
        nickname: data.nickname,
        name: data.name,
        birth_date: birthDate,
      });
      toast.success("회원가입이 완료되었습니다. 로그인해주세요.");
      router.push("/login");
    } catch (e) {
      toast.error(getApiErrorMessage(e, { client: "입력 정보를 확인해주세요." }));
    }
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} noValidate>
        <div className="flex flex-col gap-5">
          <AccountSection />
          <ProfileSection />
        </div>
        <Button type="submit" size="lg" fullWidth className="mt-7" disabled={isSubmitting}>
          {isSubmitting ? "처리 중..." : "회원가입 완료"}
        </Button>
      </form>
    </FormProvider>
  );
}

export default RegisterForm;
