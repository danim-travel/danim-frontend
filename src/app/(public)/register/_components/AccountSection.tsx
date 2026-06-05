"use client";
import { TextField, PasswordField, VerificationField } from "@/components/common";
import { PasswordStrength } from "../../_components";

export interface AccountSectionProps {
  password: string;
  onPasswordChange: (value: string) => void;
}

/** 회원가입 계정 섹션: 이메일/인증코드/비밀번호/비밀번호 확인. */
export function AccountSection({ password, onPasswordChange }: AccountSectionProps) {
  return (
    <>
      <VerificationField
        label="이메일"
        type="email"
        autoComplete="email"
        placeholder="이메일 주소를 입력해주세요"
        actionLabel="인증 요청"
        actionVariant="primary"
      />

      <VerificationField
        label="인증 코드"
        type="text"
        inputMode="numeric"
        placeholder="인증 코드 6자리 입력"
        actionLabel="확인"
        actionVariant="outline"
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
      />
    </>
  );
}

export default AccountSection;
