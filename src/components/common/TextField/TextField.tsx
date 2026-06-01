import React from "react";
import { cn } from "@/lib/utils";

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  rightSlot?: React.ReactNode;
}

export function TextField({ label, helperText, error, required, rightSlot, disabled, className, ...rest }: TextFieldProps) {
  const hasError = Boolean(error);
  return (
    <label className="block">
      {label && (
        <span className="block mb-2 text-[13px] font-semibold text-text-secondary">
          {label}
          {required && <span className="text-primary"> *</span>}
        </span>
      )}
      <span className="relative block">
        <input
          data-state={hasError ? "error" : "default"}
          disabled={disabled}
          className={cn(
            "w-full py-3 px-4 rounded-input text-[14px] outline-none border transition-colors",
            "bg-[var(--input-bg)] text-[var(--input-text)]",
            hasError ? "border-[var(--input-border-error)]" : "border-[var(--input-border)]",
            disabled && "bg-[var(--input-bg-disabled)] text-[var(--input-text-disabled)] cursor-not-allowed",
            rightSlot && "pr-16",
            className
          )}
          {...rest}
        />
        {rightSlot && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">{rightSlot}</span>
        )}
      </span>
      {(helperText || error) && (
        <span className={cn("block mt-2 text-[12px]", hasError ? "text-[var(--input-text-error)]" : "text-text-muted")}>
          {error || helperText}
        </span>
      )}
    </label>
  );
}

export default TextField;
