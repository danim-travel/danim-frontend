import React from "react";
import Avatar from "../../common/Avatar/Avatar";
import Button from "../../common/Button/Button";

/**
 * UserCard / FollowItem — 유저 요약 (layout으로 통합: row=FollowItem, card=UserCard)
 * state: default · hover
 * tokens: --text-*, --color-*, --radius-card-comp
 */
export interface UserCardProps {
  user: {
    name: string;
    handle: string;
    region?: string;
    bio?: string;
    initial: string;
    color?: string;
    verified?: boolean;
    mutual?: boolean;
  };
  following?: boolean;
  layout?: "row" | "card";
  onToggleFollow?: () => void;
}

export function UserCard({ user, following, layout = "row", onToggleFollow }: UserCardProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-4)",
        padding: layout === "row" ? "var(--space-5) var(--space-6)" : "var(--space-6)",
        background: layout === "card" ? "var(--color-background-card)" : "transparent",
        borderRadius: layout === "card" ? "var(--radius-card-comp)" : 0,
        boxShadow: layout === "card" ? "var(--shadow-card)" : "none",
      }}
    >
      <Avatar size="lg" initial={user.initial} color={user.color} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <span style={{ fontSize: "var(--text-card-title-size)", fontWeight: 700, color: "var(--color-text-primary)" }}>
            {user.name}
          </span>
          {user.mutual && (
            <span
              style={{
                fontSize: "var(--text-caption-size)",
                padding: "0 var(--space-2)",
                borderRadius: "var(--radius-pill)",
                background: "var(--color-primary-soft)",
                color: "var(--color-primary-active)",
              }}
            >
              맞팔
            </span>
          )}
        </div>
        <div style={{ fontSize: "var(--text-caption-size)", color: "var(--color-text-tertiary)" }}>
          {user.handle}
          {user.region ? ` · ${user.region}` : ""}
        </div>
        {user.bio && (
          <div style={{ fontSize: "var(--text-body-sm-size)", color: "var(--color-text-secondary)", marginTop: "var(--space-1)" }}>
            {user.bio}
          </div>
        )}
      </div>
      <Button
        variant={following ? "primary" : "outline"}
        size="sm"
        onClick={onToggleFollow}
        style={{ borderRadius: "var(--radius-pill)", minWidth: 96 }}
      >
        {following ? "팔로잉" : user.mutual ? "맞팔로우" : "팔로우"}
      </Button>
    </div>
  );
}

export default UserCard;
