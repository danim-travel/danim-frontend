import React from "react";
import { cn } from "@/lib/utils";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
  src?: string;
  initial?: string;
  size?: AvatarSize;
  ring?: boolean;
  color?: string;
}

export function Avatar({ src, initial, size = "md", ring, color }: AvatarProps) {
  const inner = (
    <div
      className={cn(
        "grid place-items-center rounded-avatar font-bold border-2 border-bg-card text-text-inverse shrink-0"
      )}
      style={{
        width:    `var(--avatar-size-${size})`,
        height:   `var(--avatar-size-${size})`,
        fontSize: `var(--avatar-font-${size})`,
        ...(src
          ? { backgroundImage: `url(${src})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { backgroundColor: color ?? "var(--color-primary)" }
        ),
      }}
    >
      {!src && initial}
    </div>
  );

  if (!ring) return inner;
  return (
    <div className="p-[2.5px] rounded-avatar bg-[var(--avatar-story-border)]">
      {inner}
    </div>
  );
}

export default Avatar;
