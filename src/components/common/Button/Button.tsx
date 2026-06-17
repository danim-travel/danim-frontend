"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

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
  sm: "h-(--button-sm-height) px-(--button-sm-padding-x) text-(length:--button-sm-font-size) gap-(--button-sm-gap) [&_svg]:w-(--button-sm-icon-size) [&_svg]:h-(--button-sm-icon-size)",
  md: "h-(--button-md-height) px-(--button-md-padding-x) text-(length:--button-md-font-size) gap-(--button-md-gap) [&_svg]:w-(--button-md-icon-size) [&_svg]:h-(--button-md-icon-size)",
  lg: "h-(--button-lg-height) px-(--button-lg-padding-x) text-(length:--button-lg-font-size) gap-(--button-lg-gap) [&_svg]:w-(--button-lg-icon-size) [&_svg]:h-(--button-lg-icon-size)",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-(--button-primary-bg) text-(color:--button-primary-text) shadow-(--button-primary-shadow) border-transparent " +
    "hover:bg-(--button-primary-bg-hover) active:bg-(--button-primary-bg-active) " +
    "focus-visible:outline-none focus-visible:shadow-(--button-primary-shadow-focus)",
  secondary:
    "bg-(--button-secondary-bg) text-(color:--button-secondary-text) border border-(--button-secondary-border) " +
    "hover:bg-(--button-secondary-bg-hover) " +
    "focus-visible:outline-none focus-visible:shadow-(--button-primary-shadow-focus)",
  outline:
    "bg-(--button-outline-bg) text-(color:--button-outline-text) border border-(--button-outline-border) " +
    "hover:bg-(--button-outline-bg-hover) " +
    "focus-visible:outline-none focus-visible:shadow-(--button-primary-shadow-focus)",
};

const disabledClasses: Record<ButtonVariant, string> = {
  primary:   "bg-(--button-primary-bg-disabled) text-(color:--button-primary-text-disabled) shadow-none border-transparent",
  secondary: "bg-(--button-secondary-bg-disabled) text-(color:--button-secondary-text-disabled) border border-(--button-secondary-border)",
  outline:   "bg-(--button-outline-bg-disabled) text-(color:--button-outline-text-disabled) border border-(--button-outline-border-disabled)",
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
        "inline-flex items-center justify-center whitespace-nowrap rounded-button font-semibold tracking-snug transition-[background,box-shadow] duration-fast",
        sizeClasses[size],
        fullWidth && "w-full",
        isDisabled
          ? cn(disabledClasses[variant], "cursor-not-allowed opacity-100")
          : cn(variantClasses[variant], "cursor-pointer"),
        className
      )}
      {...rest}
    >
      {!loading && leftIcon}
      {loading ? <Spinner size="sm" /> : children}
      {!loading && rightIcon}
    </button>
  );
}

export default Button;
