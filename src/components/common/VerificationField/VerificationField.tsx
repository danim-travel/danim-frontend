"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { TextField } from "../TextField/TextField";
import { Button, type ButtonVariant } from "../Button/Button";

export type VerificationHelperTone = "muted" | "primary" | "error";

export interface VerificationFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** 필드 라벨 */
  label: string;
  required?: boolean;
  /** 오른쪽 액션 버튼 라벨 (예: "인증 요청", "확인") */
  actionLabel: string;
  onAction?: () => void;
  actionVariant?: ButtonVariant;
  actionDisabled?: boolean;
  /** 입력 행 아래 안내 문구 (예: 타이머) */
  helperText?: string;
  helperTone?: VerificationHelperTone;
}

const helperToneClass: Record<VerificationHelperTone, string> = {
  muted: "text-text-muted",
  primary: "text-primary",
  error: "text-error",
};

/** 입력 + 오른쪽 액션 버튼으로 구성된 인증용 필드 (이메일 인증 요청, 인증 코드 확인 등). */
export function VerificationField({
  label,
  required = true,
  actionLabel,
  onAction,
  actionVariant = "primary",
  actionDisabled,
  helperText,
  helperTone = "primary",
  className,
  ...inputProps
}: VerificationFieldProps) {
  return (
    <div>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <TextField
            label={label}
            required={required}
            className={cn("h-12", className)}
            {...inputProps}
          />
        </div>
        <Button
          type="button"
          variant={actionVariant}
          onClick={onAction}
          disabled={actionDisabled}
          className="h-12 px-6 shrink-0 whitespace-nowrap text-body-sm"
        >
          {actionLabel}
        </Button>
      </div>
      {helperText && (
        <p className={cn("text-caption mt-2", helperToneClass[helperTone])}>{helperText}</p>
      )}
    </div>
  );
}

export default VerificationField;
