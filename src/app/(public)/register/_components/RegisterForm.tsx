"use client";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/common";
import { signup } from "@/lib/api/auth";
import { isApiError } from "@/lib/apiClient";
import { useAuthStore } from "@/store/authStore";
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

  const { handleSubmit, formState: { isSubmitting } } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const birthDate = `${data.birthYear}-${data.birthMonth.padStart(2, "0")}-${data.birthDay.padStart(2, "0")}`;
      const response = await signup({
        email_token: data.emailToken,
        password: data.password,
        nickname: data.nickname,
        name: data.name,
        birth_date: birthDate,
      });
      useAuthStore.getState().setAuth(
        {
          userId: response.user.user_id,
          nickname: response.user.nickname,
          profileImg: response.user.profile_img,
        },
        response.access_token
      );
      toast.success("회원가입이 완료되었습니다.");
      router.push("/");
    } catch (e) {
      if (isApiError(e)) {
        toast.error(typeof e.detail === "string" ? e.detail : "입력 정보를 확인해주세요.");
      } else {
        toast.error("회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
    }
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit}>
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
