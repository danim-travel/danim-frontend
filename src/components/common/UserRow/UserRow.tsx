"use client";
import React from "react";
import { cn } from "@/lib/utils";

export interface UserRowProps {
  /** Avatar 컴포넌트를 직접 넘김 */
  avatar: React.ReactNode;
  /** 닉네임/이름 */
  title: string;
  /** 두 번째 줄 (실명, 마지막 메시지 등) */
  subtitle?: string;
  /** 세 번째 줄 (팔로워용 소개 등) */
  description?: string;
  /** 우측 액션 (팔로우 버튼, 좋아요 수 등) */
  trailing?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function UserRow({
  avatar,
  title,
  subtitle,
  description,
  trailing,
  onClick,
  className,
}: UserRowProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3",
        onClick && "cursor-pointer",
        className
      )}
    >
      {avatar}
      <div className="flex-1 flex flex-col min-w-0">
        <span className="text-body-sm font-semibold text-text truncate">{title}</span>
        {subtitle && (
          <span className="text-caption text-text-muted truncate">{subtitle}</span>
        )}
        {description && (
          <span className="text-caption text-text-muted truncate">{description}</span>
        )}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  );
}

export default UserRow;
