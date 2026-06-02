import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

const sizeMap: Record<Size, string> = {
  sm: "w-4 h-4 border-2",
  md: "w-7 h-7 border-2",
  lg: "w-10 h-10 border-[3px]",
};

type SpinnerProps = {
  size?: Size;
  className?: string;
};

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <div
      className={cn(
        "rounded-full border-border animate-spin border-t-primary",
        sizeMap[size],
        className
      )}
      role="status"
      aria-label="로딩 중"
    />
  );
}

type SpinnerOverlayProps = {
  size?: Size;
  className?: string;
};

export function SpinnerOverlay({ size, className }: SpinnerOverlayProps) {
  return (
    <div className={cn("flex items-center justify-center w-full h-full", className)}>
      <Spinner size={size} />
    </div>
  );
}
