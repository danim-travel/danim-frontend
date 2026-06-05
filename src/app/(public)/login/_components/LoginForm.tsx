"use client";
import Link from "next/link";
import { Button, TextField, PasswordField } from "@/components/common";

/** 로그인 이메일/비밀번호 입력 폼. */
export function LoginForm() {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: API 연동
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextField
        label="이메일"
        type="email"
        placeholder="이메일 주소를 입력하세요"
        autoComplete="email"
      />

      <div className="flex flex-col gap-2">
        <PasswordField
          label="비밀번호"
          placeholder="비밀번호를 입력하세요"
          autoComplete="current-password"
        />
        <div className="flex justify-end">
          <Link
            href="/reset-password"
            className="text-caption font-semibold text-primary-hover hover:underline"
          >
            비밀번호를 잊으셨나요?
          </Link>
        </div>
      </div>

      <Button type="submit" fullWidth className="h-[52px] text-base">로그인</Button>
    </form>
  );
}

export default LoginForm;
