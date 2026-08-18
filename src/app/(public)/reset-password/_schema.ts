import { z } from "zod";
import { PASSWORD_RULES } from "../_constants/passwordValidation";

export const resetPasswordSchema = z
  .object({
    email: z.string().min(1, "이메일을 입력해주세요").email("올바른 이메일 형식이 아닙니다"),
    emailToken: z.string().min(1, "이메일 인증이 필요합니다"),
    password: z
      .string()
      .min(PASSWORD_RULES.minLength, `${PASSWORD_RULES.minLength}자 이상이어야 합니다`)
      .max(PASSWORD_RULES.maxLength, `${PASSWORD_RULES.maxLength}자 이하여야 합니다`)
      .regex(PASSWORD_RULES.hasLetter, "영문이 포함되어야 합니다")
      .regex(PASSWORD_RULES.hasUppercase, "영문 대문자가 포함되어야 합니다")
      .regex(PASSWORD_RULES.hasNumber, "숫자가 포함되어야 합니다")
      .regex(PASSWORD_RULES.hasSpecial, "특수문자가 포함되어야 합니다"),
    passwordConfirm: z.string().min(1, "비밀번호 확인을 입력해주세요"),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["passwordConfirm"],
  });

export type ResetPasswordFormValues = z.input<typeof resetPasswordSchema>;
