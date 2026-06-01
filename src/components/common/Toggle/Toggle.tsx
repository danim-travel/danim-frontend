import React from "react";

/**
 * Toggle — 설정 on/off 스위치
 * state: default · checked · disabled · focus
 * tokens: --color-primary, --color-border, --shadow-focus-ring
 */
export interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      data-state={checked ? "checked" : "default"}
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 24,
        borderRadius: "var(--radius-full)",
        background: checked ? "var(--color-primary)" : "var(--color-border)",
        border: "none",
        position: "relative",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "background 120ms ease",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: checked ? 22 : 2,
          width: 20,
          height: 20,
          borderRadius: "var(--radius-full)",
          background: "var(--color-white)",
          transition: "left 120ms ease",
        }}
      />
    </button>
  );
}

export default Toggle;
