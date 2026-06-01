import React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "tag" | "filter";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  selected?: boolean;
  leftIcon?: React.ReactNode;
}

export function Badge({ variant = "tag", selected, leftIcon, children, className, ...rest }: BadgeProps) {
  const selectable = variant === "filter";
  return (
    <span
      data-variant={variant}
      data-state={selected ? "selected" : "default"}
      className={cn(
        "inline-flex items-center gap-1 px-3 py-1 rounded-pill text-label font-semibold border",
        selected
          ? "bg-[var(--chip-bg-selected)] text-text-inverse border-[var(--chip-bg-selected)]"
          : "bg-[var(--chip-bg)] text-[var(--chip-text)] border-[var(--chip-border)]",
        selectable ? "cursor-pointer" : "cursor-default",
        className
      )}
      {...rest}
    >
      {leftIcon}
      {children}
    </span>
  );
}

export default Badge;
