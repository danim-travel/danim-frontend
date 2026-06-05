"use client";
import React from "react";
import { cn } from "@/lib/utils";

export type IconButtonVariant = "ghost" | "filled";
export type IconButtonSize = "sm" | "md" | "lg";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  "aria-label": string;
}

const sizeClasses: Record<IconButtonSize, string> = {
  sm: "w-9 h-9",
  md: "w-11 h-11",
  lg: "w-12 h-12",
};

const hoverClasses: Record<IconButtonVariant, string> = {
  ghost: "hover:bg-bg-subtle",
  filled: "hover:bg-bg-subtle",
};

export function IconButton({ icon, variant = "ghost", size = "md", disabled, className, ...rest }: IconButtonProps) {
  return (
    <button
      data-variant={variant}
      disabled={disabled}
      className={cn(
        "grid place-items-center rounded-full text-text-muted border-none transition-[background] duration-fast",
        sizeClasses[size],
        variant === "filled" ? "bg-bg-subtle" : "bg-transparent",
        disabled ? "cursor-not-allowed opacity-50" : cn("cursor-pointer", hoverClasses[variant]),
        className
      )}
      {...rest}
    >
      {icon}
    </button>
  );
}

export default IconButton;
