import React from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: "py-2 px-4",
  md: "py-3 px-5",
  lg: "py-4 px-6",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:   "bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] shadow-[var(--button-primary-shadow)] border-transparent",
  secondary: "bg-[var(--button-secondary-bg)] text-[var(--button-secondary-text)] border border-[var(--button-secondary-border)]",
  outline:   "bg-[var(--button-outline-bg)] text-[var(--button-outline-text)] border border-[var(--button-outline-border)]",
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
  className,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      data-variant={variant}
      data-state={isDisabled ? "disabled" : "default"}
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-button text-button font-semibold tracking-snug transition-[background,box-shadow] duration-fast",
        sizeClasses[size],
        fullWidth && "w-full",
        isDisabled
          ? "bg-[var(--button-primary-bg-disabled)] text-[var(--button-primary-text-disabled)] shadow-none border-transparent cursor-not-allowed opacity-100"
          : cn(variantClasses[variant], "cursor-pointer"),
        className
      )}
      {...rest}
    >
      {leftIcon}
      {loading ? "처리 중…" : children}
      {rightIcon}
    </button>
  );
}

export default Button;
