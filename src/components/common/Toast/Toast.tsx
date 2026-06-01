import React from "react";

/**
 * Toast — 일시 알림 (저장/완료 피드백)
 * variant: default | success | error
 * tokens: --toast-*, --radius-card-comp, --shadow-floating
 */
export type ToastVariant = "default" | "success" | "error";

export interface ToastProps {
  variant?: ToastVariant;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const bg: Record<ToastVariant, string> = {
  default: "var(--toast-default-bg)",
  success: "var(--toast-success-bg)",
  error: "var(--toast-error-bg)",
};

export function Toast({ variant = "default", icon, children }: ToastProps) {
  return (
    <div
      role="status"
      data-variant={variant}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--icon-gap)",
        padding: "var(--space-3) var(--space-5)",
        borderRadius: "var(--radius-card-comp)",
        background: bg[variant],
        color: "var(--toast-default-fg)",
        boxShadow: "var(--shadow-floating)",
        fontSize: "var(--text-body-size)",
        fontWeight: 500,
      }}
    >
      {icon}
      {children}
    </div>
  );
}

export default Toast;
