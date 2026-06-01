import React from "react";
import { cn } from "@/lib/utils";

export type ToastVariant = "default" | "success" | "error";
export interface ToastProps { variant?: ToastVariant; icon?: React.ReactNode; children: React.ReactNode; }

const variantClasses: Record<ToastVariant, string> = {
  default: "bg-[var(--toast-bg)]",
  success: "bg-[var(--toast-bg-success)]",
  error:   "bg-[var(--toast-bg-error)]",
};

export function Toast({ variant = "default", icon, children }: ToastProps) {
  return (
    <div
      role="status"
      data-variant={variant}
      className={cn(
        "inline-flex items-center gap-2 px-5 py-3 rounded-card text-text-inverse text-body font-medium shadow-floating",
        variantClasses[variant]
      )}
    >
      {icon}
      {children}
    </div>
  );
}

export default Toast;
