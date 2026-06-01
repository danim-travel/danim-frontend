import React from "react";
import Avatar from "../../common/Avatar/Avatar";

/**
 * CommentItem — 댓글 행
 * tokens: --text-*, --color-text-*
 */
export interface CommentItemProps {
  author: { name: string; initial: string; color?: string };
  text: string;
  time: string;
  likeCount?: number;
}

export function CommentItem({ author, text, time, likeCount }: CommentItemProps) {
  return (
    <div style={{ display: "flex", gap: "var(--space-3)", padding: "var(--space-3) 0" }}>
      <Avatar size="sm" initial={author.initial} color={author.color} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "var(--text-body-sm-size)", color: "var(--color-text-secondary)" }}>
          <b style={{ color: "var(--color-text-primary)" }}>{author.name}</b> {text}
        </div>
        <div
          style={{
            display: "flex",
            gap: "var(--space-3)",
            marginTop: "var(--space-1)",
            fontSize: "var(--text-caption-size)",
            color: "var(--color-text-tertiary)",
          }}
        >
          <span>{time}</span>
          {likeCount != null && <span>좋아요 {likeCount}</span>}
          <span>답글 달기</span>
        </div>
      </div>
    </div>
  );
}

export default CommentItem;
