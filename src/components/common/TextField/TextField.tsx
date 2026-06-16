"use client";
import React, { useId } from "react";
import { cn } from "@/lib/utils";
import { FieldLabel } from "../FieldLabel/FieldLabel";

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  /** error가 없을 때 helperText 색상 — "primary"는 성공 메시지(초록) 표시용 */
  helperTone?: "muted" | "primary";
  error?: string;
  required?: boolean;
  rightSlot?: React.ReactNode;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ label, helperText, helperTone = "muted", error, required, rightSlot, disabled, className, ...rest }, ref) {
    const hasError = Boolean(error);
    const helperId = useId();
    return (
      <label className="block">
        {label && <FieldLabel required={required}>{label}</FieldLabel>}
        <span className="relative block">
          <input
            ref={ref}
            data-state={hasError ? "error" : "default"}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={(helperText || error) ? helperId : undefined}
            className={cn(
              "w-full py-3 px-4 rounded-input text-base outline-none border transition-colors",
              "bg-(--input-bg) text-(--input-text)",
              hasError
                ? "border-(--input-border-error)"
                : "border-(--input-border) focus:border-(--input-border-focus)",
              disabled && "bg-(--input-bg-disabled) text-(--input-text-disabled) cursor-not-allowed",
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
          <span
            id={helperId}
            className={cn(
              "block mt-2 text-caption",
              hasError ? "text-(--input-text-error)" : helperTone === "primary" ? "text-primary" : "text-text-muted"
            )}
          >
            {error || helperText}
          </span>
        )}
      </label>
    );
  }
);

export default TextField;
