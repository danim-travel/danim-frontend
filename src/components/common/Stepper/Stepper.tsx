import React from "react";
import { cn } from "@/lib/utils";

export interface StepperStep {
  label: string;
}

export interface StepperProps {
  steps: StepperStep[];
  current: number;
  showLabels?: boolean;
}

type StepState = "active" | "completed" | "default";

const markerClasses: Record<StepState, string> = {
  active: "bg-primary border-primary text-text-inverse",
  completed: "bg-primary border-primary text-text-inverse",
  default: "bg-bg-card border-border text-text-disabled",
};

const labelClasses: Record<StepState, string> = {
  active: "text-primary",
  completed: "text-primary",
  default: "text-text-disabled",
};

export function Stepper({ steps, current, showLabels = true }: StepperProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {/* 상단: 마커 + 연결선 */}
      <div className="flex items-center">
        {steps.map((_, i) => {
          const state: StepState =
            i < current ? "completed" : i === current ? "active" : "default";
          return (
            <React.Fragment key={i}>
              <div
                data-state={state}
                className={cn(
                  "w-8 h-8 rounded-full grid place-items-center text-body-sm font-bold border-2 shrink-0 transition-all",
                  markerClasses[state]
                )}
              >
                {i + 1}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-px mx-1.5",
                    i < current ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* 하단: 라벨 */}
      {showLabels && (
        <div className="flex items-start">
          {steps.map((s, i) => {
            const state: StepState =
              i < current ? "completed" : i === current ? "active" : "default";
            return (
              <React.Fragment key={i}>
                <div className="w-8 shrink-0 flex justify-center">
                  <span
                    className={cn(
                      "text-tiny font-medium leading-tight max-w-[44px] truncate text-center",
                      labelClasses[state]
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && <div className="flex-1 mx-1.5" />}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Stepper;
