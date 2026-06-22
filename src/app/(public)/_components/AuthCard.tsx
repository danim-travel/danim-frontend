import React from "react";
import { cn } from "@/lib/utils";

export type AuthCardSize = "sm" | "lg";

/**
 * 인증 페이지(로그인·회원가입·비밀번호 재설정) 공통 카드 셸.
 * - sm: 460px, 세로 flex(gap-8) — 로그인·비밀번호 재설정
 * - lg: 560px, 블록 흐름 — 회원가입(내부에서 margin으로 간격 제어)
 */
const sizeClass: Record<AuthCardSize, string> = {
  sm: "max-w-[460px] pt-12 pb-10 px-10 flex flex-col gap-8",
  lg: "max-w-[560px] pt-12 pb-12 px-6 md:px-12",
};

export interface AuthCardProps {
  size?: AuthCardSize;
  className?: string;
  children: React.ReactNode;
}

export function AuthCard({ size = "sm", className, children }: AuthCardProps) {
  return (
    <div className={cn("w-full bg-bg-card rounded-2xl shadow-overlay", sizeClass[size], className)}>
      {children}
    </div>
  );
}

export default AuthCard;
