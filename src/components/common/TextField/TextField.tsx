import React from "react";

/**
 * TextField — 라벨 + 입력 + 헬퍼/에러
 * state: default · focus · error · disabled · placeholder
 * tokens: --input-*, --radius-input, --text-label/helper/error
 */
export interface TextFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  rightSlot?: React.ReactNode;
}

export function TextField({
  label,
  helperText,
  error,
  required,
  rightSlot,
  disabled,
  style,
  ...rest
}: TextFieldProps) {
  const hasError = Boolean(error);
  return (
    <label style={{ display: "block" }}>
      {label && (
        <span
          style={{
            display: "block",
            marginBottom: "var(--space-2)",
            fontSize: "var(--text-label-size)",
            fontWeight: "var(--text-label-weight)" as React.CSSProperties["fontWeight"],
            color: "var(--color-text-secondary)",
          }}
        >
          {label}
          {required && <span style={{ color: "var(--color-primary)" }}> *</span>}
        </span>
      )}
      <span style={{ position: "relative", display: "block" }}>
        <input
          data-state={hasError ? "error" : "default"}
          disabled={disabled}
          style={{
            width: "100%",
            padding: "var(--input-padding-y) var(--input-padding-x)",
            paddingRight: rightSlot ? "64px" : undefined,
            background: disabled
              ? "var(--input-disabled-bg)"
              : "var(--input-default-bg)",
            border: `1px solid ${
              hasError ? "var(--input-error-border)" : "var(--input-default-border)"
            }`,
            borderRadius: "var(--radius-input)",
            fontSize: "var(--text-body-size)",
            color: "var(--input-default-fg)",
            outline: "none",
            ...style,
          }}
          {...rest}
        />
        {rightSlot && (
          <span
            style={{
              position: "absolute",
              right: "var(--space-2)",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            {rightSlot}
          </span>
        )}
      </span>
      {(helperText || error) && (
        <span
          style={{
            display: "block",
            marginTop: "var(--space-2)",
            fontSize: "var(--text-helper-size)",
            color: hasError ? "var(--input-error-fg)" : "var(--color-text-tertiary)",
          }}
        >
          {error || helperText}
        </span>
      )}
    </label>
  );
}

export default TextField;
