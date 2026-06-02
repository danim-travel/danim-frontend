"use client";
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
  sm: "h-[var(--button-sm-height)] px-[var(--button-sm-padding-x)] text-[var(--button-sm-font-size)] gap-[var(--button-sm-gap)] [&_svg]:w-[var(--button-sm-icon-size)] [&_svg]:h-[var(--button-sm-icon-size)]",
  md: "h-[var(--button-md-height)] px-[var(--button-md-padding-x)] text-[var(--button-md-font-size)] gap-[var(--button-md-gap)] [&_svg]:w-[var(--button-md-icon-size)] [&_svg]:h-[var(--button-md-icon-size)]",
  lg: "h-[var(--button-lg-height)] px-[var(--button-lg-padding-x)] text-[var(--button-lg-font-size)] gap-[var(--button-lg-gap)] [&_svg]:w-[var(--button-lg-icon-size)] [&_svg]:h-[var(--button-lg-icon-size)]",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:   "bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] shadow-[var(--button-primary-shadow)] border-transparent",
  secondary: "bg-[var(--button-secondary-bg)] text-[var(--button-secondary-text)] border border-[var(--button-secondary-border)]",
  outline:   "bg-[var(--button-outline-bg)] text-[var(--button-outline-text)] border border-[var(--button-outline-border)]",
};

const disabledClasses: Record<ButtonVariant, string> = {
  primary:   "bg-[var(--button-primary-bg-disabled)] text-[var(--button-primary-text-disabled)] shadow-none border-transparent",
  secondary: "bg-[var(--button-secondary-bg-disabled)] text-[var(--button-secondary-text-disabled)] border border-[var(--button-secondary-border)]",
  outline:   "bg-[var(--button-outline-bg-disabled)] text-[var(--button-outline-text-disabled)] border border-[var(--button-outline-border-disabled)]",
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
        "inline-flex items-center justify-center rounded-button font-semibold tracking-snug transition-[background,box-shadow] duration-fast",
        sizeClasses[size],
        fullWidth && "w-full",
        isDisabled
          ? cn(disabledClasses[variant], "cursor-not-allowed opacity-100")
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
