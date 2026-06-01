import React from "react";

/**
 * EmptyState — 결과 없음 (검색 · 피드)
 * state: empty
 * tokens: --text-body/caption, --color-text-*, --space-*
 */
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "var(--space-12) var(--space-6)",
        gap: "var(--space-3)",
      }}
    >
      {icon && <div style={{ color: "var(--color-text-disabled)" }}>{icon}</div>}
      <div
        style={{
          fontSize: "var(--text-card-title-size)",
          fontWeight: "var(--text-card-title-weight)" as React.CSSProperties["fontWeight"],
          color: "var(--color-text-primary)",
        }}
      >
        {title}
      </div>
      {description && (
        <div style={{ fontSize: "var(--text-body-size)", color: "var(--color-text-tertiary)" }}>
          {description}
        </div>
      )}
      {action && <div style={{ marginTop: "var(--space-2)" }}>{action}</div>}
    </div>
  );
}

export default EmptyState;
