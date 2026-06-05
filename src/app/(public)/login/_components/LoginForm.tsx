"use client";
import { type FormEvent } from "react";
import Link from "next/link";
import { Button, TextField, PasswordField } from "@/components/common";

export function LoginForm() {
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // TODO: API 연동
  }

  return (
    <>
      {/* 소셜 로그인 — 공식 브랜드 색상(#FEE500 등)은 디자인 토큰 대상이 아님 */}
      <div className="flex flex-col gap-2">
        <Button
          variant="secondary"
          fullWidth
          className="h-[52px] text-base font-bold bg-[#FEE500] text-[#191600] border-none shadow-none hover:opacity-90"
        >
          카카오톡으로 계속하기
        </Button>
        <Button
          variant="secondary"
          fullWidth
          className="h-[52px] text-base bg-bg-subtle text-text hover:bg-bg"
        >
          Google로 계속하기
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <span className="flex-1 h-px bg-border" />
        <span className="text-caption text-text-muted whitespace-nowrap">또는 이메일로 로그인</span>
        <span className="flex-1 h-px bg-border" />
      </div>

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
    </>
  );
}

export default LoginForm;
