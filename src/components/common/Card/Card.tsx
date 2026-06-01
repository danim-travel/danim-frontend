import React from "react";

/**
 * Card — 둥근 카드 컨테이너 (PostCard·UserCard 등의 베이스)
 * state: default · hover (interactive)
 * tokens: --post-card-*, --radius-card-comp, --shadow-card/hover
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "md" | "sm" | "none";
  interactive?: boolean;
  as?: keyof JSX.IntrinsicElements;
}

const pad: Record<NonNullable<CardProps["padding"]>, string> = {
  md: "var(--card-padding)",
  sm: "var(--card-padding-sm)",
  none: "0",
};

export function Card({
  padding = "md",
  interactive,
  as: Tag = "div",
  style,
  children,
  ...rest
}: CardProps) {
  return React.createElement(
    Tag,
    {
      "data-interactive": interactive ? "true" : undefined,
      style: {
        background: "var(--post-card-default-bg)",
        borderRadius: "var(--radius-card-comp)",
        boxShadow: "var(--shadow-card)",
        padding: pad[padding],
        transition: interactive ? "box-shadow 160ms ease, transform 160ms ease" : undefined,
        ...style,
      },
      ...rest,
    },
    children
  );
}

export default Card;
