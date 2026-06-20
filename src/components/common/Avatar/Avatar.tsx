"use client";
import { cn } from "@/lib/utils";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
  src?: string;
  initial?: string;
  size?: AvatarSize;
  ring?: boolean;
  /** Tailwind bg 클래스. 예: "bg-primary", "bg-amber-400" */
  colorClass?: string;
  /** 크기 등을 반응형으로 덮어쓸 때 사용 (예: "w-20 h-20 md:w-28 md:h-28") */
  className?: string;
}

const sizeClasses: Record<AvatarSize, { box: string; text: string }> = {
  sm: { box: "w-8 h-8",   text: "text-body-sm" },
  md: { box: "w-11 h-11", text: "text-title-lg" },
  lg: { box: "w-14 h-14", text: "text-section-title" },
  xl: { box: "w-28 h-28", text: "text-hero" },
};

export function Avatar({ src, initial, size = "md", ring, colorClass = "bg-primary", className }: AvatarProps) {
  const { box, text } = sizeClasses[size];
  const inner = (
    <div
      className={cn(
        "relative overflow-hidden grid place-items-center rounded-avatar font-bold ring-2 ring-bg-card text-text-inverse shrink-0",
        !src && colorClass,
        box,
        text,
        className
      )}
    >
      {src
        ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )
        : initial
      }
    </div>
  );

  if (!ring) return inner;
  return (
    <div className="p-0.5 rounded-avatar bg-(--avatar-story-border)">
      {inner}
    </div>
  );
}

export default Avatar;
