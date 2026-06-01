import React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps { width?: number | string; height?: number | string; radius?: "control" | "card" | "full"; className?: string; }

const radiusClasses: Record<NonNullable<SkeletonProps["radius"]>, string> = {
  control: "rounded-control",
  card:    "rounded-card",
  full:    "rounded-full",
};

export function Skeleton({ width = "100%", height = 16, radius = "control", className }: SkeletonProps) {
  return (
    <span
      aria-hidden
      className={cn("block bg-bg-subtle animate-pulse", radiusClasses[radius], className)}
      style={{ width, height }}
    />
  );
}

export interface LoadingStateProps { rows?: number; }

export function LoadingState({ rows = 3 }: LoadingStateProps) {
  return (
    <div data-state="loading" className="flex flex-col gap-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 items-center">
          <Skeleton width={44} height={44} radius="full" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton width="40%" height={14} />
            <Skeleton width="70%" height={12} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default LoadingState;
