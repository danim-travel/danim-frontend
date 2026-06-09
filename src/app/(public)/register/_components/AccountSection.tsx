"use client";
import { useFormContext, useController } from "react-hook-form";
import { TextField, PasswordField, VerificationField } from "@/components/common";
import { PasswordStrength } from "../../_components";
import { PASSWORD_RULES } from "../../_constants/passwordValidation";
import { EMAIL_PATTERN } from "../../_constants/emailValidation";
import { useEmailVerification } from "../_hooks/useEmailVerification";
import type { RegisterFormValues } from "../_schema";

export function AccountSection() {
  // FormProvider로 공유된 폼 컨텍스트에서 필요한 것만 꺼냄
  // control: 각 필드를 RHF에 연결 / setValue: 인증 완료 시 emailToken 직접 주입 / errors: 필드 에러 메시지
  const { control, setValue, formState: { errors } } = useFormContext<RegisterFormValues>();

  const { field: emailField } = useController({ control, name: "email" });
  // 이메일 형식이 아니면 "인증 요청" 버튼 비활성화
  const isEmailValid = EMAIL_PATTERN.test(emailField.value);
  const { field: passwordField } = useController({ control, name: "password" });
  const { field: passwordConfirmField } = useController({ control, name: "passwordConfirm" });

  const {
    code, setCode, codeSent, verified,
    requestLoading, confirmLoading, confirmError,
    requestVerify, confirmCode, resetVerification,
  } = useEmailVerification({
    // 인증 완료 시 백엔드가 발급한 email_token을 폼에 주입 → Zod가 emailToken 필드 통과 처리
    onVerified: (emailToken) => setValue("emailToken", emailToken, { shouldValidate: true }),
    purpose: 'signup',
  });

  // 인증 코드 필드 하단 메시지 색상: 완료=초록 / 에러=빨강 / 기본=회색
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
          resetVerification(); // 이메일 변경 시 인증 상태 초기화
        }}
        actionLabel={codeSent ? "재요청" : "인증 요청"}
        actionVariant="primary"
        actionDisabled={requestLoading || verified || !isEmailValid}
        actionLoading={requestLoading}
        onAction={() => requestVerify(emailField.value)}
        helperText={errors.email?.message}
        helperTone="error"
        disabled={verified} // 인증 완료 후 이메일 수정 불가
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
        actionDisabled={confirmLoading || verified || !codeSent} // 코드 발송 전엔 비활성화
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
