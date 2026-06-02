"use client";
import React from "react";
import { cn } from "@/lib/utils";

export interface ToggleProps { checked: boolean; onChange: (next: boolean) => void; disabled?: boolean; }

export function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      data-state={checked ? "checked" : "default"}
      onClick={() => onChange(!checked)}
      className={cn(
        "w-11 h-6 rounded-full border-none relative transition-colors duration-fast",
        checked ? "bg-primary" : "bg-border",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 w-5 h-5 rounded-full bg-bg-card transition-[left] duration-fast",
          checked ? "left-5.5" : "left-0.5"
        )}
      />
    </button>
  );
}

export default Toggle;
