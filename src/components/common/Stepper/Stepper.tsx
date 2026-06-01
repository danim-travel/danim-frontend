import React from "react";
import { cn } from "@/lib/utils";

export interface StepperStep { label: string; }
export interface StepperProps { steps: StepperStep[]; current: number; }

export function Stepper({ steps, current }: StepperProps) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => {
        const state = i < current ? "completed" : i === current ? "active" : "default";
        return (
          <React.Fragment key={i}>
            <div className="flex items-center gap-2">
              <span
                data-state={state}
                className={cn(
                  "w-7 h-7 rounded-full grid place-items-center text-label font-bold",
                  state === "active"    && "bg-[var(--stepper-bg-active)] text-[var(--stepper-text-active)]",
                  state === "completed" && "bg-[var(--stepper-bg-completed)] text-[var(--stepper-text-completed)]",
                  state === "default"   && "bg-transparent text-[var(--stepper-text)] border-2 border-[var(--stepper-border)]"
                )}
              >
                {i + 1}
              </span>
              <span className={cn("text-body-sm", state === "default" ? "text-text-muted" : "text-text")}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && <span className="w-6 h-0.5 bg-border" />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default Stepper;
