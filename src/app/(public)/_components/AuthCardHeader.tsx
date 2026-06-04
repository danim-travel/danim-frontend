import React from "react";
import { cn } from "@/lib/utils";

export interface AuthCardHeaderProps {
  title: string;
  subtitle: React.ReactNode;
  /** 루트 컨테이너 보정용 (예: gap 조정) */
  className?: string;
}

/** 인증 카드 상단의 가운데 정렬 타이틀 + 서브타이틀. */
export function AuthCardHeader({ title, subtitle, className }: AuthCardHeaderProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <h2 className="text-section-title font-bold text-text tracking-tight">{title}</h2>
      <p className="text-body-sm leading-normal text-text-muted text-center">{subtitle}</p>
    </div>
  );
}

export default AuthCardHeader;
