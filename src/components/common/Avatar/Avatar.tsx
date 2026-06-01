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

const sizeClasses: Record<AvatarSize, { box: string; text: string }> = {
  sm: { box: "w-8 h-8",   text: "text-[13px]" },
  md: { box: "w-11 h-11", text: "text-[18px]" },
  lg: { box: "w-14 h-14", text: "text-[22px]" },
  xl: { box: "w-28 h-28", text: "text-[45px]" },
};

export function Avatar({ src, initial, size = "md", ring, color }: AvatarProps) {
  const { box, text } = sizeClasses[size];
  const inner = (
    <div
      className={cn(
        "grid place-items-center rounded-avatar font-bold border-2 border-bg-card text-text-inverse shrink-0",
        box,
        text
      )}
      style={
        src
          ? { backgroundImage: `url(${src})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { backgroundColor: color ?? "var(--color-primary)" }
      }
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
