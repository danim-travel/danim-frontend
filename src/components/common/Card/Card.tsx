"use client";
import React from "react";
import { cn } from "@/lib/utils";

export type CardVariant = "elevated" | "section" | "thumbnail";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "md" | "sm" | "none";
  interactive?: boolean;
  variant?: CardVariant;
}

const padClasses: Record<NonNullable<CardProps["padding"]>, string> = {
  md:   "p-6",
  sm:   "p-4",
  none: "p-0",
};

const variantClasses: Record<CardVariant, string> = {
  elevated:  "bg-(--post-card-bg) rounded-card shadow-card",
  section:   "bg-(--card-section-bg) rounded-card",
  thumbnail: "bg-(--card-thumbnail-bg) rounded-card overflow-hidden",
};

export function Card({
  padding = "md",
  interactive,
  variant = "elevated",
  className,
  children,
  ...rest
}: CardProps) {
  const isThumbnail = variant === "thumbnail";
  const allowInteractive = interactive && !isThumbnail;
  return (
    <div
      data-variant={variant}
      data-interactive={allowInteractive ? "true" : undefined}
      className={cn(
        variantClasses[variant],
        isThumbnail ? "p-0" : padClasses[padding],
        allowInteractive &&
          "cursor-pointer transition-[box-shadow,transform] duration-normal hover:-translate-y-0.5 hover:shadow-card-hover",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export default Card;
