"use client";
import { useState } from "react";
import { TextField, PasswordField, VerificationField } from "@/components/common";
import { PasswordStrength } from "../../_components";
import { requestEmailVerify, confirmEmailCode } from "@/lib/api/auth";
import { isApiError } from "@/lib/apiClient";

export interface AccountSectionProps {
  email: string;
  onEmailChange: (value: string) => void;
  emailError?: string;
  password: string;
  onPasswordChange: (value: string) => void;
  passwordError?: string;
  passwordConfirm: string;
  onPasswordConfirmChange: (value: string) => void;
  passwordConfirmError?: string;
  /** 이메일 인증 완료 시 호출 — RegisterForm이 emailVerified 필드를 true로 설정 */
  onEmailVerified: () => void;
  emailVerifiedError?: string;
}

export function AccountSection({
  email,
  onEmailChange,
  emailError,
  password,
  onPasswordChange,
  passwordError,
  passwordConfirm,
  onPasswordConfirmChange,
  passwordConfirmError,
  onEmailVerified,
  emailVerifiedError,
}: AccountSectionProps) {
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [requestError, setRequestError] = useState<string>();
  const [confirmError, setConfirmError] = useState<string>();

  async function handleRequestVerify() {
    setRequestError(undefined);
    setRequestLoading(true);
    try {
      await requestEmailVerify(email);
      setCodeSent(true);
    } catch (e) {
      setRequestError(isApiError(e) ? String(e.detail) : "인증 요청에 실패했습니다.");
    } finally {
      setRequestLoading(false);
    }
  }

  async function handleConfirmCode() {
    setConfirmError(undefined);
    setConfirmLoading(true);
    try {
      await confirmEmailCode(email, code);
      setVerified(true);
      onEmailVerified();
    } catch (e) {
      setConfirmError(isApiError(e) ? String(e.detail) : "코드 확인에 실패했습니다.");
    } finally {
      setConfirmLoading(false);
    }
  }

  return (
    <>
      <VerificationField
        label="이메일"
        type="email"
        autoComplete="email"
        placeholder="이메일 주소를 입력해주세요"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        actionLabel={codeSent ? "재요청" : "인증 요청"}
        actionVariant="primary"
        actionDisabled={requestLoading || verified}
        onAction={handleRequestVerify}
        helperText={emailError ?? requestError}
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
            : confirmError ?? emailVerifiedError
        }
        helperTone={
          verified ? "primary" : confirmError || emailVerifiedError ? "error" : "muted"
        }
        disabled={verified}
      />

      <div>
        <PasswordField
          label="비밀번호"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="8자 이상, 영문 + 숫자 + 특수문자 조합"
          className="h-12"
          error={passwordError}
        />
        <PasswordStrength value={password} />
      </div>

      <TextField
        label="비밀번호 확인"
        required
        type="password"
        autoComplete="new-password"
        placeholder="비밀번호를 다시 입력해주세요"
        className="h-12"
        value={passwordConfirm}
        onChange={(e) => onPasswordConfirmChange(e.target.value)}
        error={passwordConfirmError}
      />
    </>
  );
}

export default AccountSection;
