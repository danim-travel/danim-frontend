import React from "react";
import Avatar from "../../common/Avatar/Avatar";
import Button from "../../common/Button/Button";

/**
 * NotificationItem — 알림 행 (알림 패널)
 * type: follow | like | comment | mention
 * tokens: --text-*, --color-*, --radius-control
 */
export type NotificationType = "follow" | "like" | "comment" | "mention";

export interface NotificationItemProps {
  actor: { name: string; initial: string; color?: string };
  type: NotificationType;
  message: React.ReactNode;
  time: string;
  thumbnail?: string;
  following?: boolean;
  onFollow?: () => void;
}

export function NotificationItem({
  actor,
  type,
  message,
  time,
  thumbnail,
  following,
  onFollow,
}: NotificationItemProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3) var(--space-6)" }}>
      <Avatar size="md" initial={actor.initial} color={actor.color} />
      <div style={{ flex: 1, minWidth: 0, fontSize: "var(--text-body-sm-size)", color: "var(--color-text-secondary)", lineHeight: "var(--text-body-sm-line)" }}>
        {message}
        <span style={{ color: "var(--color-text-tertiary)", marginLeft: "var(--space-1)" }}>{time}</span>
      </div>
      {type === "follow" && (
        <Button variant={following ? "secondary" : "primary"} size="sm" onClick={onFollow}>
          {following ? "팔로잉" : "맞팔로우"}
        </Button>
      )}
      {(type === "like" || type === "comment" || type === "mention") && thumbnail && (
        <div style={{ width: 44, height: 44, borderRadius: "var(--radius-sm)", background: `center/cover url(${thumbnail})` }} />
      )}
    </div>
  );
}

export default NotificationItem;
