import React from "react";

/**
 * Avatar — 프로필 이미지/이니셜
 * state: default · story (ring)
 * tokens: --avatar-*, --radius-avatar
 */
export type AvatarSize = "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
  src?: string;
  initial?: string;
  size?: AvatarSize;
  ring?: boolean; // story ring
  color?: string; // background token reference
}

const dim: Record<AvatarSize, number> = { sm: 32, md: 44, lg: 56, xl: 112 };

export function Avatar({
  src,
  initial,
  size = "md",
  ring,
  color = "var(--color-primary)",
}: AvatarProps) {
  const d = dim[size];
  const inner = (
    <div
      style={{
        width: d,
        height: d,
        borderRadius: "var(--radius-avatar)",
        background: src ? `center/cover url(${src})` : color,
        color: "var(--color-text-inverse)",
        display: "grid",
        placeItems: "center",
        fontWeight: 700,
        fontSize: d * 0.4,
        border: `2px solid var(--avatar-default-border)`,
      }}
    >
      {!src && initial}
    </div>
  );
  if (!ring) return inner;
  return (
    <div
      style={{
        padding: 2.5,
        borderRadius: "var(--radius-avatar)",
        background: "var(--avatar-story-border)",
      }}
    >
      {inner}
    </div>
  );
}

export default Avatar;
