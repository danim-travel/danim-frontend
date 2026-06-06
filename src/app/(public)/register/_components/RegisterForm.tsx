"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/common";
import { signup } from "@/lib/api/auth";
import { isApiError } from "@/lib/apiClient";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";
import { AccountSection } from "./AccountSection";
import { ProfileSection } from "./ProfileSection";

const signupSchema = z
  .object({
    email: z.string().min(1, "이메일을 입력해주세요").email("올바른 이메일 형식이 아닙니다"),
    emailVerified: z.boolean().refine((v) => v, { message: "이메일 인증이 필요합니다" }),
    password: z
      .string()
      .min(8, "8자 이상이어야 합니다")
      .regex(/[a-zA-Z]/, "영문이 포함되어야 합니다")
      .regex(/[0-9]/, "숫자가 포함되어야 합니다")
      .regex(/[^a-zA-Z0-9]/, "특수문자가 포함되어야 합니다"),
    passwordConfirm: z.string().min(1, "비밀번호 확인을 입력해주세요"),
    nickname: z
      .string()
      .min(2, "2자 이상이어야 합니다")
      .max(20, "20자 이하여야 합니다")
      .regex(/^[a-zA-Z0-9가-힣]+$/, "영문, 한글, 숫자만 사용할 수 있습니다"),
    name: z.string().min(1, "이름을 입력해주세요"),
    birthYear: z.string().regex(/^\d{4}$/, "연도(YYYY)를 입력해주세요"),
    birthMonth: z.string().regex(/^(0?[1-9]|1[0-2])$/, "월(MM)을 입력해주세요"),
    birthDay: z.string().regex(/^(0?[1-9]|[12]\d|3[01])$/, "일(DD)을 입력해주세요"),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["passwordConfirm"],
  });

type RegisterFormValues = z.input<typeof signupSchema>;

export function RegisterForm() {
  const router = useRouter();

  // 각 필드를 useState로 관리하고 setValue로 RHF에 동기화 — watch() 대신 사용해 React Compiler 경고 방지
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [nickname, setNickname] = useState("");
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");

  const {
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      emailVerified: false,
      password: "",
      passwordConfirm: "",
      nickname: "",
      name: "",
      birthYear: "",
      birthMonth: "",
      birthDay: "",
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      const birthDate = `${data.birthYear}-${data.birthMonth.padStart(2, "0")}-${data.birthDay.padStart(2, "0")}`;
      const response = await signup({
        email: data.email,
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

  const birthDateError =
    errors.birthYear?.message || errors.birthMonth?.message || errors.birthDay?.message;

  return (
    <form onSubmit={onSubmit}>
      <div className="flex flex-col gap-5">
        <AccountSection
          email={email}
          onEmailChange={(v) => { setEmail(v); setValue("email", v); }}
          emailError={errors.email?.message}
          password={password}
          onPasswordChange={(v) => { setPassword(v); setValue("password", v); }}
          passwordError={errors.password?.message}
          passwordConfirm={passwordConfirm}
          onPasswordConfirmChange={(v) => { setPasswordConfirm(v); setValue("passwordConfirm", v); }}
          passwordConfirmError={errors.passwordConfirm?.message}
          onEmailVerified={() => setValue("emailVerified", true)}
          emailVerifiedError={errors.emailVerified?.message}
        />
        <ProfileSection
          nickname={nickname}
          onNicknameChange={(v) => { setNickname(v); setValue("nickname", v); }}
          nicknameError={errors.nickname?.message}
          name={name}
          onNameChange={(v) => { setName(v); setValue("name", v); }}
          nameError={errors.name?.message}
          birthYear={birthYear}
          onBirthYearChange={(v) => { setBirthYear(v); setValue("birthYear", v); }}
          birthMonth={birthMonth}
          onBirthMonthChange={(v) => { setBirthMonth(v); setValue("birthMonth", v); }}
          birthDay={birthDay}
          onBirthDayChange={(v) => { setBirthDay(v); setValue("birthDay", v); }}
          birthDateError={birthDateError}
        />
      </div>

      <Button type="submit" size="lg" fullWidth className="mt-7" disabled={isSubmitting}>
        {isSubmitting ? "처리 중..." : "회원가입 완료"}
      </Button>
    </form>
  );
}

export default RegisterForm;
