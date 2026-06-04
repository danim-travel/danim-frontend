"use client";
import { useState } from "react";
import { Button, TextField, PasswordField, VerificationField } from "@/components/common";
import { PasswordStrength } from "../../_components";

/** 비밀번호 재설정 폼: 이메일 인증 → 인증 코드 확인 → 새 비밀번호 설정. */
export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: API 연동
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* 이메일 + 인증 요청 */}
      <VerificationField
        label="이메일"
        type="email"
        autoComplete="email"
        placeholder="이메일 주소"
        actionLabel="인증 요청"
        actionVariant="primary"
        onAction={() => setCodeSent(true)}
      />

      {/* 인증 코드 + 확인 */}
      <VerificationField
        label="인증 코드"
        type="text"
        inputMode="numeric"
        placeholder="인증 코드 6자리 입력"
        actionLabel="확인"
        actionVariant="outline"
        helperText={codeSent ? "인증 코드를 발송했습니다. (2:32 남음)" : undefined}
        helperTone="primary"
      />

      {/* 새 비밀번호 + 강도바 */}
      <div>
        <PasswordField
          label="새 비밀번호"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="8자 이상, 영문+숫자+특수문자 조합"
        />
        <PasswordStrength value={password} />
      </div>

      {/* 새 비밀번호 확인 */}
      <TextField
        label="새 비밀번호 확인"
        type="password"
        autoComplete="new-password"
        placeholder="비밀번호를 다시 입력하세요"
        className="h-12"
      />

      <Button type="submit" fullWidth className="h-[52px] text-base">비밀번호 재설정</Button>
    </form>
  );
}

export default ResetPasswordForm;
