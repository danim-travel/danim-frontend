"use client";
import { cn } from "@/lib/utils";

export interface SegmentedItem {
  key: string;
  label: string;
}

export interface SegmentedProps {
  items: SegmentedItem[];
  value: string;
  onChange: (key: string) => void;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function Segmented({ items, value, onChange, disabled, fullWidth }: SegmentedProps) {
  return (
    <div
      role="group"
      className={cn("flex gap-[var(--segmented-item-gap)]", fullWidth && "w-full")}
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
              "flex-1 h-[var(--segmented-item-height)] rounded-[var(--segmented-item-radius)] border text-body font-semibold transition-colors",
              selected
                ? "bg-[var(--segmented-item-bg-selected)] text-[var(--segmented-item-text-selected)] border-[var(--segmented-item-border-selected)]"
                : "bg-[var(--segmented-item-bg)] text-[var(--segmented-item-text)] border-[var(--segmented-item-border)]",
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
