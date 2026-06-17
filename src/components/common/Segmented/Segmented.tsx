"use client";
import { cn } from "@/lib/utils";

export interface SegmentedItem {
  key: string;
  label: string;
}

export type SegmentedSize = "md" | "lg";

export interface SegmentedProps {
  items: SegmentedItem[];
  value: string;
  onChange: (key: string) => void;
  disabled?: boolean;
  fullWidth?: boolean;
  /** md(기본 38px) / lg(48px · 폼 입력과 정렬) */
  size?: SegmentedSize;
}

const sizeHeight: Record<SegmentedSize, string> = {
  md: "h-(--segmented-item-height)",
  lg: "h-(--segmented-item-height-lg)",
};

export function Segmented({ items, value, onChange, disabled, fullWidth, size = "md" }: SegmentedProps) {
  return (
    <div
      role="group"
      className={cn("flex gap-(--segmented-item-gap)", fullWidth && "w-full")}
    >
      {items.map((item) => {
        const selected = item.key === value;
        return (
          <button
            key={item.key}
            type="button"
            disabled={disabled}
            data-state={selected ? "selected" : "default"}
            onClick={() => onChange(item.key)}
            className={cn(
              "flex-1 rounded-(--segmented-item-radius) border text-base font-semibold whitespace-nowrap transition-colors",
              sizeHeight[size],
              selected
                ? "bg-(--segmented-item-bg-selected) text-(--segmented-item-text-selected) border-(--segmented-item-border-selected)"
                : "bg-(--segmented-item-bg) text-(--segmented-item-text) border-(--segmented-item-border)",
              disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export default Segmented;
