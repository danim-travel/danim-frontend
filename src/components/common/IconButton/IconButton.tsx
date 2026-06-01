import React from "react";

/**
 * IconButton — 아이콘 단독 버튼 (헤더 · 카드 더보기 · 탭)
 * variant: ghost | filled
 * state: default · hover · active · focus · disabled
 * tokens: --color-text-tertiary, --radius-full, --shadow-focus-ring
 */
export type IconButtonVariant = "ghost" | "filled";
export type IconButtonSize = "sm" | "md";

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  "aria-label": string;
}

const dim: Record<IconButtonSize, number> = { sm: 36, md: 44 };

export function IconButton({
  icon,
  variant = "ghost",
  size = "md",
  disabled,
  style,
  ...rest
}: IconButtonProps) {
  return (
    <button
      data-variant={variant}
      disabled={disabled}
      style={{
        width: dim[size],
        height: dim[size],
        display: "grid",
        placeItems: "center",
        borderRadius: "var(--radius-full)",
        color: "var(--color-text-tertiary)",
        background:
          variant === "filled" ? "var(--color-background-subtle)" : "transparent",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "background 120ms ease",
        ...style,
      }}
      {...rest}
    >
      {icon}
    </button>
  );
}

export default IconButton;
