import React from "react";
import Avatar from "../../common/Avatar/Avatar";

/**
 * CourseStep — 코스 경유지 카드 (번호 + 장소 + 메모)
 * tokens: --stepper-*, --text-*, --color-*
 */
export interface CourseStepProps {
  index: number;
  place: string;
  memo?: string;
  image?: string;
  last?: boolean;
}

export function CourseStep({ index, place, memo, image, last }: CourseStepProps) {
  return (
    <div style={{ display: "flex", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: "var(--radius-full)",
            background: "var(--stepper-active-bg)",
            color: "var(--stepper-active-fg)",
            display: "grid",
            placeItems: "center",
            fontSize: "var(--text-label-size)",
            fontWeight: 700,
          }}
        >
          {index}
        </span>
        {!last && <span style={{ flex: 1, width: 2, background: "var(--color-border)", marginTop: "var(--space-1)" }} />}
      </div>
      <div style={{ flex: 1, paddingBottom: "var(--space-5)" }}>
        <div
          style={{
            fontSize: "var(--text-card-title-size)",
            fontWeight: "var(--text-card-title-weight)" as React.CSSProperties["fontWeight"],
            color: "var(--color-text-primary)",
          }}
        >
          {place}
        </div>
        {memo && (
          <div style={{ marginTop: "var(--space-1)", fontSize: "var(--text-body-sm-size)", color: "var(--color-text-secondary)" }}>
            {memo}
          </div>
        )}
        {image && (
          <div
            style={{
              marginTop: "var(--space-3)",
              height: 140,
              borderRadius: "var(--radius-control)",
              background: `center/cover url(${image})`,
            }}
          />
        )}
      </div>
    </div>
  );
}

export default CourseStep;
