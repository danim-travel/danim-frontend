import { z } from "zod";
import { PASSWORD_RULES } from "../_constants/passwordValidation";

export const signupSchema = z
  .object({
    email: z.string().min(1, "이메일을 입력해주세요").email("올바른 이메일 형식이 아닙니다"),
    emailVerified: z.boolean().refine((v) => v, { message: "이메일 인증이 필요합니다" }),
    password: z
      .string()
      .min(PASSWORD_RULES.minLength, `${PASSWORD_RULES.minLength}자 이상이어야 합니다`)
      .regex(PASSWORD_RULES.hasLetter, "영문이 포함되어야 합니다")
      .regex(PASSWORD_RULES.hasNumber, "숫자가 포함되어야 합니다")
      .regex(PASSWORD_RULES.hasSpecial, "특수문자가 포함되어야 합니다"),
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

export type RegisterFormValues = z.input<typeof signupSchema>;
