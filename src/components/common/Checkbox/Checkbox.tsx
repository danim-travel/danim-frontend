import React from "react";

/**
 * Checkbox — 동의 · 선택 체크박스
 * state: default · checked · disabled · focus
 * tokens: --color-primary, --color-border, --radius-xs
 */
export interface CheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
}

export function Checkbox({ checked, onChange, label, disabled }: CheckboxProps) {
  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: "var(--text-body-size)",
        color: "var(--color-text-secondary)",
      }}
    >
      <span
        role="checkbox"
        aria-checked={checked}
        data-state={checked ? "checked" : "default"}
        onClick={() => !disabled && onChange(!checked)}
        style={{
          width: 20,
          height: 20,
          display: "grid",
          placeItems: "center",
          borderRadius: "var(--radius-xs)",
          background: checked ? "var(--color-primary)" : "var(--color-white)",
          border: `1.5px solid ${checked ? "var(--color-primary)" : "var(--color-border)"}`,
          color: "var(--color-text-inverse)",
        }}
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
