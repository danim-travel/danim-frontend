import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "md" | "sm" | "none";
  interactive?: boolean;
  as?: keyof React.JSX.IntrinsicElements;
}

const padClasses: Record<NonNullable<CardProps["padding"]>, string> = {
  md:   "p-6",
  sm:   "p-4",
  none: "p-0",
};

export function Card({ padding = "md", interactive, as: Tag = "div", className, children, ...rest }: CardProps) {
  return React.createElement(
    Tag,
    {
      "data-interactive": interactive ? "true" : undefined,
      className: cn(
        "bg-[var(--post-card-bg)] rounded-card shadow-card",
        padClasses[padding],
        interactive && "transition-[box-shadow,transform] duration-[160ms]",
        className
      ),
      ...rest,
    },
    children
  );
}

export default Card;
