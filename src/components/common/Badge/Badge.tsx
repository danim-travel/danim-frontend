import React from "react";

/**
 * Badge — 태그 · 인증배지 · 필터칩 (정적 badge + 클릭 chip을 variant로 통합)
 * variant: tag | filter | status
 * state: default · selected
 * tokens: --chip-*, --radius-pill, --text-label/caption
 */
export type BadgeVariant = "tag" | "filter" | "status";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  selected?: boolean;
  leftIcon?: React.ReactNode;
}

export function Badge({
  variant = "tag",
  selected,
  leftIcon,
  children,
  style,
  ...rest
}: BadgeProps) {
  const selectable = variant === "filter";
  return (
    <span
      data-variant={variant}
      data-state={selected ? "selected" : "default"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-1)",
        padding: "var(--space-1) var(--space-3)",
        borderRadius: "var(--radius-pill)",
        fontSize: "var(--text-label-size)",
        fontWeight: "var(--text-label-weight)" as React.CSSProperties["fontWeight"],
        background: selected
          ? "var(--chip-selected-bg)"
          : "var(--chip-default-bg)",
        color: selected ? "var(--chip-selected-fg)" : "var(--chip-default-fg)",
        border: `1px solid ${
          selected ? "var(--chip-selected-bg)" : "var(--chip-default-border)"
        }`,
        cursor: selectable ? "pointer" : "default",
        ...style,
      }}
      {...rest}
    >
      {leftIcon}
      {children}
    </span>
  );
}

export default Badge;
