import React from "react";
import Avatar from "../../common/Avatar/Avatar";

/**
 * ConversationItem — DM 목록 행
 * state: default · active · unread
 * tokens: --color-selected-background, --text-*, --color-*
 */
export interface ConversationItemProps {
  user: { name: string; initial: string; color?: string };
  preview: string;
  time?: string;
  unread?: boolean;
  online?: boolean;
  active?: boolean;
  onClick?: () => void;
}

export function ConversationItem({
  user,
  preview,
  time,
  unread,
  online,
  active,
  onClick,
}: ConversationItemProps) {
  return (
    <button
      onClick={onClick}
      data-state={active ? "active" : "default"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        width: "100%",
        textAlign: "left",
        padding: "var(--space-3) var(--space-6)",
        background: active ? "var(--color-selected-background)" : "transparent",
        border: "none",
        cursor: "pointer",
      }}
    >
      <span style={{ position: "relative" }}>
        <Avatar size="lg" initial={user.initial} color={user.color} />
        {online && (
          <span
            style={{
              position: "absolute",
              bottom: 1,
              right: 1,
              width: 12,
              height: 12,
              borderRadius: "var(--radius-full)",
              background: "var(--color-primary)",
              border: "2px solid var(--color-background-card)",
            }}
          />
        )}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "var(--text-card-title-size)",
            fontWeight: unread ? 700 : 600,
            color: "var(--color-text-primary)",
          }}
        >
          {user.name}
        </div>
        <div
          style={{
            fontSize: "var(--text-body-sm-size)",
            color: unread ? "var(--color-text-secondary)" : "var(--color-text-tertiary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {preview}
          {time ? ` · ${time}` : ""}
        </div>
      </div>
    </button>
  );
}

export default ConversationItem;
