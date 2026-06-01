import React from "react";

/**
 * PostActionBar — 좋아요 · 저장 액션
 * state: default · active(liked/saved)
 * tokens: --post-action-*, --color-border, --text-caption
 */
export interface PostActionBarProps {
  likeCount: number;
  liked?: boolean;
  saved?: boolean;
  onLike?: () => void;
  onSave?: () => void;
}

export function PostActionBar({ likeCount, liked, saved, onLike, onSave }: PostActionBarProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: "var(--space-3)",
        borderTop: "1px solid var(--color-border)",
      }}
    >
      <button
        onClick={onLike}
        data-state={liked ? "active" : "default"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--space-2)",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "var(--text-caption-size)",
          fontWeight: 700,
          color: liked ? "var(--post-action-active-fg)" : "var(--post-action-default-fg)",
        }}
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
          <path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6C19 16.5 12 21 12 21z" strokeLinejoin="round" />
        </svg>
        {likeCount}
      </button>
      <button
        onClick={onSave}
        data-state={saved ? "active" : "default"}
        aria-label="저장"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: saved ? "var(--post-action-active-fg)" : "var(--post-action-default-fg)",
        }}
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
          <path d="M6 4h12v17l-6-4-6 4V4z" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

export default PostActionBar;
