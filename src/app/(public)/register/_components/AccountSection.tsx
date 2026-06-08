"use client";
import { useState } from "react";
import { useFormContext, useController } from "react-hook-form";
import { TextField, PasswordField, VerificationField } from "@/components/common";
import { PasswordStrength } from "../../_components";
import { requestEmailVerify, confirmEmailCode } from "@/lib/api/auth";
import { isApiError } from "@/lib/apiClient";
import { toast } from "@/store/toastStore";
import type { RegisterFormValues } from "../_schema";

export function AccountSection() {
  const { control, setValue, formState: { errors } } = useFormContext<RegisterFormValues>();

  const { field: emailField } = useController({ control, name: "email" });
  const { field: passwordField } = useController({ control, name: "password" });
  const { field: passwordConfirmField } = useController({ control, name: "passwordConfirm" });

  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState<string>();

  async function handleRequestVerify() {
    setRequestLoading(true);
    try {
      await requestEmailVerify(emailField.value);
      setCodeSent(true);
      setCode("");
      toast.success("인증코드가 이메일로 발송되었습니다.");
    } catch {
      toast.error("인증코드 발송에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setRequestLoading(false);
    }
  }

  async function handleConfirmCode() {
    setConfirmError(undefined);
    setConfirmLoading(true);
    try {
      await confirmEmailCode(emailField.value, code);
      setVerified(true);
      setValue("emailVerified", true, { shouldValidate: true });
    } catch (e) {
      setConfirmError(isApiError(e) && typeof e.detail === "string" ? e.detail : "코드 확인에 실패했습니다.");
    } finally {
      setConfirmLoading(false);
    }
  }

  const codeTone = verified ? "primary" : (confirmError || errors.emailVerified?.message) ? "error" : "muted";

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
          setCodeSent(false);
          setCode("");
          setConfirmError(undefined);
        }}
        actionLabel={codeSent ? "재요청" : "인증 요청"}
        actionVariant="primary"
        actionDisabled={requestLoading || verified}
        actionLoading={requestLoading}
        onAction={handleRequestVerify}
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
        onAction={handleConfirmCode}
        helperText={
          verified
            ? "이메일 인증이 완료되었습니다."
            : confirmError ?? errors.emailVerified?.message
        }
        helperTone={codeTone}
        disabled={verified}
      />

      <div>
        <PasswordField
          label="비밀번호"
          required
          autoComplete="new-password"
          placeholder="8자 이상, 영문 + 숫자 + 특수문자 조합"
          className="h-12"
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
