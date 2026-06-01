import React from "react";

/**
 * Button — 기본 액션 트리거
 * variant: primary | secondary | outline
 * state: default · hover · active · focus · disabled · loading
 * tokens: --button-*, --radius-button, --shadow-button-primary, --text-button
 */
export type ButtonVariant = "primary" | "secondary" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const sizePad: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: "var(--space-2) var(--space-4)" },
  md: { padding: "var(--space-3) var(--space-5)" },
  lg: { padding: "var(--space-4) var(--space-6)" },
};

const variantStyle: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "var(--button-primary-default-bg)",
    color: "var(--button-primary-default-fg)",
    boxShadow: "var(--button-primary-default-shadow)",
    border: "none",
  },
  secondary: {
    background: "var(--button-secondary-default-bg)",
    color: "var(--button-secondary-default-fg)",
    border: "1px solid var(--button-secondary-default-border)",
  },
  outline: {
    background: "var(--button-outline-default-bg)",
    color: "var(--button-outline-default-fg)",
    border: "1.5px solid var(--button-outline-default-border)",
  },
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  loading,
  leftIcon,
  rightIcon,
  disabled,
  children,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      data-variant={variant}
      data-state={isDisabled ? "disabled" : "default"}
      disabled={isDisabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--icon-gap)",
        width: fullWidth ? "100%" : undefined,
        borderRadius: "var(--radius-button)",
        fontSize: "var(--text-button-size)",
        fontWeight: "var(--text-button-weight)" as React.CSSProperties["fontWeight"],
        letterSpacing: "var(--text-button-spacing)",
        cursor: isDisabled ? "not-allowed" : "pointer",
        transition: "background 120ms ease, box-shadow 120ms ease",
        ...sizePad[size],
        ...variantStyle[variant],
        ...(isDisabled
          ? {
              background: "var(--button-primary-disabled-bg)",
              color: "var(--button-primary-disabled-fg)",
              boxShadow: "none",
            }
          : null),
        ...style,
      }}
      {...rest}
    >
      {leftIcon}
      {loading ? "처리 중…" : children}
      {rightIcon}
    </button>
  );
}

export default Button;
