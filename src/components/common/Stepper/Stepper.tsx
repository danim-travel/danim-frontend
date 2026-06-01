import React from "react";

/**
 * Stepper — 코스 단계 인디케이터
 * state: default(미방문) · active(현재) · completed(완료)
 * tokens: --stepper-*
 */
export interface StepperStep {
  label: string;
}

export interface StepperProps {
  steps: StepperStep[];
  current: number; // 0-indexed
}

export function Stepper({ steps, current }: StepperProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
      {steps.map((s, i) => {
        const state = i < current ? "completed" : i === current ? "active" : "default";
        const circle: React.CSSProperties =
          state === "active"
            ? { background: "var(--stepper-active-bg)", color: "var(--stepper-active-fg)" }
            : state === "completed"
            ? { background: "var(--stepper-completed-bg)", color: "var(--stepper-completed-fg)" }
            : {
                background: "transparent",
                color: "var(--stepper-default-fg)",
                border: "1.5px solid var(--stepper-default-border)",
              };
        return (
          <React.Fragment key={i}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <span
                data-state={state}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "var(--radius-full)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "var(--text-label-size)",
                  fontWeight: 700,
                  ...circle,
                }}
              >
                {i + 1}
              </span>
              <span
                style={{
                  fontSize: "var(--text-label-size)",
                  color:
                    state === "default"
                      ? "var(--color-text-tertiary)"
                      : "var(--color-text-primary)",
                }}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span style={{ width: 24, height: 2, background: "var(--color-border)" }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default Stepper;
