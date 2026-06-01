import React from "react";

/**
 * LoadingState / Skeleton — 로딩 placeholder
 * state: loading
 * tokens: --color-background-subtle, --radius-card-comp/--radius-control
 */
export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: "control" | "card" | "full";
  style?: React.CSSProperties;
}

const radiusToken: Record<NonNullable<SkeletonProps["radius"]>, string> = {
  control: "var(--radius-control)",
  card: "var(--radius-card-comp)",
  full: "var(--radius-full)",
};

export function Skeleton({ width = "100%", height = 16, radius = "control", style }: SkeletonProps) {
  return (
    <span
      aria-hidden
      style={{
        display: "block",
        width,
        height,
        borderRadius: radiusToken[radius],
        background: "var(--color-background-subtle)",
        ...style,
      }}
    />
  );
}

export interface LoadingStateProps {
  rows?: number;
}

export function LoadingState({ rows = 3 }: LoadingStateProps) {
  return (
    <div
      data-state="loading"
      style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
          <Skeleton width={44} height={44} radius="full" />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <Skeleton width="40%" height={14} />
            <Skeleton width="70%" height={12} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default LoadingState;
