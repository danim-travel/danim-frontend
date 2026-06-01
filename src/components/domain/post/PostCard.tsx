import React from "react";
import Card from "../../common/Card/Card";
import Avatar from "../../common/Avatar/Avatar";
import Badge from "../../common/Badge/Badge";
import PostActionBar from "./PostActionBar";

/**
 * PostCard — 게시글 피드 카드 (메인 피드 Article · 프로필)
 * state: default · hover
 * tokens: --post-card-*, --post-action-*, --radius-card-comp
 */
export interface PostCardProps {
  author: { name: string; initial: string; color?: string; region: string };
  location: string;
  coverImage?: string;
  text: string;
  likeCount: number;
  liked?: boolean;
  saved?: boolean;
  onLike?: () => void;
  onSave?: () => void;
}

export function PostCard({
  author,
  location,
  coverImage,
  text,
  likeCount,
  liked,
  saved,
  onLike,
  onSave,
}: PostCardProps) {
  return (
    <Card padding="none" interactive style={{ overflow: "hidden" }}>
      <div
        style={{
          height: 200,
          position: "relative",
          background: coverImage
            ? `center/cover url(${coverImage})`
            : "var(--color-background-subtle)",
        }}
      >
        <span style={{ position: "absolute", top: "var(--space-3)", left: "var(--space-3)" }}>
          <Badge variant="tag" leftIcon={<span aria-hidden>📍</span>}>
            {location}
          </Badge>
        </span>
      </div>
      <div style={{ padding: "var(--space-4) var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <Avatar size="sm" initial={author.initial} color={author.color} />
          <div>
            <div
              style={{
                fontSize: "var(--text-label-size)",
                fontWeight: 700,
                color: "var(--color-text-primary)",
              }}
            >
              {author.name}
            </div>
            <div style={{ fontSize: "var(--text-caption-size)", color: "var(--color-text-tertiary)" }}>
              {author.region}
            </div>
          </div>
        </div>
        <p
          style={{
            fontSize: "var(--text-body-sm-size)",
            lineHeight: "var(--text-body-sm-line)",
            color: "var(--color-text-secondary)",
            whiteSpace: "pre-line",
          }}
        >
          {text}
        </p>
        <PostActionBar likeCount={likeCount} liked={liked} saved={saved} onLike={onLike} onSave={onSave} />
      </div>
    </Card>
  );
}

export default PostCard;
