import React from "react";

export interface CourseStepProps { index: number; place: string; memo?: string; image?: string; last?: boolean; }

export function CourseStep({ index, place, memo, image, last }: CourseStepProps) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <span className="w-7 h-7 shrink-0 rounded-full bg-[var(--stepper-bg-active)] text-[var(--stepper-text-active)] grid place-items-center text-[13px] font-bold">
          {index}
        </span>
        {!last && <span className="flex-1 w-0.5 bg-border mt-1" />}
      </div>
      <div className="flex-1 pb-5">
        <div className="text-[16px] font-semibold text-text">{place}</div>
        {memo && <div className="mt-1 text-[13px] text-text-secondary">{memo}</div>}
        {image && (
          <div
            className="mt-3 h-[140px] rounded-control"
            style={{ backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center" }}
          />
        )}
      </div>
    </div>
  );
}

export default CourseStep;
