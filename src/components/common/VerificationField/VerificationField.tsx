"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { TextField } from "../TextField/TextField";
import { Button, type ButtonVariant } from "../Button/Button";

export type VerificationHelperTone = "muted" | "primary" | "error";

export interface VerificationFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** 입력 필드 위에 표시되는 라벨 텍스트 */
  label: string;
  /** true면 라벨 옆에 * 표시 */
  required?: boolean;
  /** 오른쪽 버튼에 표시할 텍스트 (예: "인증 요청", "중복확인") */
  actionLabel: string;
  /** 버튼 클릭 시 실행할 함수 */
  onAction?: () => void;
  /** 버튼 스타일 종류 — "primary"(채움) | "outline"(테두리) */
  actionVariant?: ButtonVariant;
  /** true면 버튼 비활성화 */
  actionDisabled?: boolean;
  /** true면 버튼에 로딩 스피너 표시 */
  actionLoading?: boolean;
  /** 입력 필드 아래에 표시할 안내/에러 문구 */
  helperText?: string;
  /** 안내 문구 색상 — "muted"(회색) | "primary"(초록) | "error"(빨강) */
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
  actionLoading,
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
            className={className}
            {...inputProps}
          />
        </div>
        <Button
          type="button"
          variant={actionVariant}
          size="lg"
          onClick={onAction}
          disabled={actionDisabled}
          loading={actionLoading}
          className="shrink-0 whitespace-nowrap"
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
