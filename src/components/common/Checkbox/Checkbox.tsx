import React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
}

export function Checkbox({ checked, onChange, label, disabled }: CheckboxProps) {
  return (
    <label className={cn("inline-flex items-center gap-2 text-body text-text-secondary", disabled ? "cursor-not-allowed" : "cursor-pointer")}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        data-state={checked ? "checked" : "default"}
        className={cn(
          "w-5 h-5 grid place-items-center rounded-xs border-2 text-text-inverse transition-colors shrink-0",
          checked ? "bg-primary border-primary" : "bg-bg-card border-border"
        )}
      >
        {checked && (
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none">
            <path d="m5 12 5 5L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label}
    </label>
  );
}

export default Checkbox;
