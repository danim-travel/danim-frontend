import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "md" | "sm" | "none";
  interactive?: boolean;
}

const padClasses: Record<NonNullable<CardProps["padding"]>, string> = {
  md:   "p-6",
  sm:   "p-4",
  none: "p-0",
};

export function Card({ padding = "md", interactive, className, children, ...rest }: CardProps) {
  return (
    <div
      data-interactive={interactive ? "true" : undefined}
      className={cn(
        "bg-[var(--post-card-bg)] rounded-card shadow-card",
        padClasses[padding],
        interactive && "transition-[box-shadow,transform] duration-normal",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export default Card;
