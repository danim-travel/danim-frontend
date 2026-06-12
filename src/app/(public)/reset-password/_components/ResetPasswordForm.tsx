"use client";
import { Button, TextField, PasswordField, VerificationField } from "@/components/common";
import { PasswordStrength } from "../../_components";
import { PASSWORD_RULES } from "../../_constants/passwordValidation";
import { sanitizeVerificationCode } from "../../_constants/verificationCode";
import { useResetPasswordForm } from "../_hooks/useResetPasswordForm";

/** 비밀번호 재설정 폼: 이메일 인증 → 인증 코드 확인 → 새 비밀번호 설정. */
export function ResetPasswordForm() {
  const {
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
  } = useResetPasswordForm();

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {/* 이메일 + 인증 요청 */}
      <VerificationField
        label="이메일"
        type="email"
        autoComplete="email"
        placeholder="이메일 주소"
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
        disabled={verified}
      />

      {/* 인증 코드 + 확인 — 코드 발송 후 표시 */}
      {codeSent && (
        <VerificationField
          label="인증 코드"
          type="text"
          inputMode="numeric"
          placeholder="인증 코드 6자리 입력"
          value={code}
          onChange={(e) => setCode(sanitizeVerificationCode(e.target.value))}
          actionLabel={verified ? "완료" : "확인"}
          actionVariant="outline"
          actionDisabled={confirmLoading || verified}
          onAction={() => confirmCode(emailField.value)}
          helperText={
            verified
              ? "이메일 인증이 완료되었습니다."
              : confirmError ?? errors.emailToken?.message
          }
          helperTone={getCodeFieldTone()}
          disabled={verified}
        />
      )}

      {/* 새 비밀번호 + 강도바 — 인증 완료 후 표시 */}
      {verified && (
        <>
          <div>
            <PasswordField
              label="새 비밀번호"
              required
              autoComplete="new-password"
              placeholder="8자 이상, 영문+숫자+특수문자 조합"
              className="h-12"
              maxLength={PASSWORD_RULES.maxLength}
              {...passwordField}
              error={errors.password?.message}
            />
            <PasswordStrength value={passwordField.value} />
          </div>

          <TextField
            label="새 비밀번호 확인"
            required
            type="password"
            autoComplete="new-password"
            placeholder="비밀번호를 다시 입력하세요"
            className="h-12"
            {...passwordConfirmField}
            error={errors.passwordConfirm?.message}
          />
        </>
      )}

      <Button type="submit" fullWidth className="h-[52px] text-base" disabled={isSubmitting || !verified}>
        {isSubmitting ? "처리 중..." : "비밀번호 재설정"}
      </Button>
    </form>
  );
}

export default ResetPasswordForm;
