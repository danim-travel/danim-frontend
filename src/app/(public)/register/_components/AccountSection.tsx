"use client";
import { useFormContext, useController } from "react-hook-form";
import { TextField, PasswordField, VerificationField } from "@/components/common";
import { PasswordStrength } from "../../_components";
import { PASSWORD_RULES } from "../../_constants/passwordValidation";
import { useEmailVerification } from "../_hooks/useEmailVerification";
import type { RegisterFormValues } from "../_schema";

export function AccountSection() {
  const { control, setValue, formState: { errors } } = useFormContext<RegisterFormValues>();

  const { field: emailField } = useController({ control, name: "email" });
  const { field: passwordField } = useController({ control, name: "password" });
  const { field: passwordConfirmField } = useController({ control, name: "passwordConfirm" });

  const {
    code, setCode, codeSent, verified,
    requestLoading, confirmLoading, confirmError,
    requestVerify, confirmCode, resetVerification,
  } = useEmailVerification({
    onVerified: (emailToken) => setValue("emailToken", emailToken, { shouldValidate: true }),
  });

  function getCodeFieldTone() {
    if (verified) return "primary" as const;
    if (confirmError || errors.emailToken?.message) return "error" as const;
    return "muted" as const;
  }

  return (
    <>
      <VerificationField
        label="이메일"
        type="email"
        autoComplete="email"
        placeholder="이메일 주소를 입력해주세요"
        {...emailField}
        onChange={(e) => {
          emailField.onChange(e);
          resetVerification();
        }}
        actionLabel={codeSent ? "재요청" : "인증 요청"}
        actionVariant="primary"
        actionDisabled={requestLoading || verified}
        actionLoading={requestLoading}
        onAction={() => requestVerify(emailField.value)}
        helperText={errors.email?.message}
        helperTone="error"
        disabled={verified}
      />

      <VerificationField
        label="인증 코드"
        type="text"
        inputMode="numeric"
        placeholder="인증 코드 6자리 입력"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        actionLabel={verified ? "완료" : "확인"}
        actionVariant="outline"
        actionDisabled={confirmLoading || verified || !codeSent}
        onAction={() => confirmCode(emailField.value)}
        helperText={
          verified
            ? "이메일 인증이 완료되었습니다."
            : confirmError ?? errors.emailToken?.message
        }
        helperTone={getCodeFieldTone()}
        disabled={verified}
      />

      <div>
        <PasswordField
          label="비밀번호"
          required
          autoComplete="new-password"
          placeholder="8자 이상, 영문 + 숫자 + 특수문자 조합"
          className="h-12"
          maxLength={PASSWORD_RULES.maxLength}
          {...passwordField}
          error={errors.password?.message}
        />
        <PasswordStrength value={passwordField.value} />
      </div>

      <TextField
        label="비밀번호 확인"
        required
        type="password"
        autoComplete="new-password"
        placeholder="비밀번호를 다시 입력해주세요"
        className="h-12"
        {...passwordConfirmField}
        error={errors.passwordConfirm?.message}
      />
    </>
  );
}

export default AccountSection;
