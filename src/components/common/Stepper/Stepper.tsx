import React from "react";
import { cn } from "@/lib/utils";

export interface StepperStep {
  label: string;
}

export interface StepperProps {
  steps: StepperStep[];
  current: number;
  showLabels?: boolean;
  onStepClick?: (index: number) => void;
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

export function Stepper({ steps, current, showLabels = true, onStepClick }: StepperProps) {
  const clickable = !!onStepClick;
  return (
    <div className="flex flex-col gap-1.5">
      {/* 상단: 마커 + 연결선 */}
      <div className="flex items-center">
        {steps.map((_, i) => {
          const state: StepState =
            i < current ? "completed" : i === current ? "active" : "default";
          const isLast = i === steps.length - 1;
          const markerClass = cn(
            "w-8 h-8 rounded-full grid place-items-center text-body-sm font-bold border-2 shrink-0 transition-all",
            markerClasses[state],
            clickable && "cursor-pointer"
          );
          return (
            <React.Fragment key={i}>
              {/* onStepClick 제공 시 button, 아니면 div로 렌더링 */}
              {clickable ? (
                <button
                  type="button"
                  data-state={state}
                  onClick={() => onStepClick(i)}
                  className={markerClass}
                >
                  {i + 1}
                </button>
              ) : (
                <div data-state={state} className={markerClass}>
                  {i + 1}
                </div>
              )}
              {!isLast && (
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
            const isLast = i === steps.length - 1;
            return (
              <React.Fragment key={i}>
                <div className="w-8 shrink-0 flex justify-center">
                  <span
                    className={cn(
                      "text-tiny font-medium leading-tight text-center whitespace-nowrap",
                      labelClasses[state]
                    )}
                  >
                    {s.label.length > 10 ? s.label.slice(0, 10) + "…" : s.label}
                  </span>
                </div>
                {!isLast && <div className="flex-1 mx-1.5" />}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Stepper;
