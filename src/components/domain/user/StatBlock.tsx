import React from "react";

/**
 * StatBlock — 게시글/팔로워/팔로잉 수치 (프로필 Stat)
 * tokens: --text-*, --color-*, --radius-lg, --color-background-subtle
 */
export interface StatBlockProps {
  value: string | number;
  label: string;
}

export function StatBlock({ value, label }: StatBlockProps) {
  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        background: "var(--color-background-subtle)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-5) var(--space-6)",
        minWidth: 120,
      }}
    >
      <div
        style={{
          fontSize: "var(--text-section-title-size)",
          fontWeight: 700,
          color: "var(--color-text-primary)",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "var(--text-caption-size)", color: "var(--color-text-tertiary)", marginTop: "var(--space-1)" }}>
        {label}
      </div>
    </div>
  );
}

export default StatBlock;
