import React from "react";
import Avatar from "../../common/Avatar/Avatar";

/**
 * StoryRing — DM 상단 스토리 썸네일
 * state: default · seen · memo
 * tokens: --avatar-story-border, --color-*, --text-caption
 */
export interface StoryRingProps {
  user: { name: string; initial: string; color?: string };
  seen?: boolean;
  isMemo?: boolean;
}

export function StoryRing({ user, seen, isMemo }: StoryRingProps) {
  return (
    <div style={{ width: 64, display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-1)" }}>
      <div
        style={{
          padding: 2.5,
          borderRadius: "var(--radius-full)",
          background: seen ? "var(--color-border)" : "var(--avatar-story-border)",
        }}
      >
        <div style={{ padding: 2, borderRadius: "var(--radius-full)", background: "var(--color-background-card)" }}>
          <Avatar size="md" initial={user.initial} color={user.color} />
        </div>
      </div>
      <span
        style={{
          fontSize: "var(--text-caption-size)",
          color: "var(--color-text-secondary)",
          maxWidth: 64,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {isMemo ? "내 메모" : user.name}
      </span>
    </div>
  );
}

export default StoryRing;
