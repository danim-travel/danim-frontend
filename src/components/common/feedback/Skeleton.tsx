import React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps { width?: number | string; height?: number | string; radius?: "control" | "card" | "full"; className?: string; }

const radiusClasses: Record<NonNullable<SkeletonProps["radius"]>, string> = {
  control: "rounded-control",
  card:    "rounded-card",
  full:    "rounded-full",
};

export function Skeleton({ width = "100%", height = 16, radius = "control", className }: SkeletonProps) {
  const w = typeof width  === "number" ? `${width}px`  : width;
  const h = typeof height === "number" ? `${height}px` : height;
  return (
    <span
      aria-hidden
      className={cn("block bg-bg-subtle animate-pulse w-(--sk-w) h-(--sk-h)", radiusClasses[radius], className)}
      style={{ "--sk-w": w, "--sk-h": h } as React.CSSProperties}
    />
  );
}

export interface UserRowSkeletonProps {
  rows?: number;
  lines?: 2 | 3;
}

export function UserRowSkeleton({ rows = 2, lines = 2 }: UserRowSkeletonProps) {
  return (
    <div data-state="loading" className="flex flex-col gap-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 items-center">
          <Skeleton width={44} height={44} radius="full" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton width="40%" height={14} />
            <Skeleton width="70%" height={12} />
          </div>
          {lines === 3 && <Skeleton width={48} height={14} />}
        </div>
      ))}
    </div>
  );
}

// 하위호환 — 기존 LoadingState 이름 유지
export { UserRowSkeleton as LoadingState };

export default UserRowSkeleton;
