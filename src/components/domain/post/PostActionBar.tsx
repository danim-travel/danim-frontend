import React from "react";
import { cn } from "@/lib/utils";

export interface PostActionBarProps { likeCount: number; liked?: boolean; saved?: boolean; onLike?: () => void; onSave?: () => void; }

export function PostActionBar({ likeCount, liked, saved, onLike, onSave }: PostActionBarProps) {
  return (
    <div className="flex items-center justify-between pt-3 border-t border-border">
      <button
        onClick={onLike}
        data-state={liked ? "active" : "default"}
        className={cn(
          "inline-flex items-center gap-2 bg-transparent border-none cursor-pointer text-[12px] font-bold",
          liked ? "text-[var(--post-action-text-active)]" : "text-[var(--post-action-text)]"
        )}
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
        className={cn(
          "bg-transparent border-none cursor-pointer",
          saved ? "text-[var(--post-action-text-active)]" : "text-[var(--post-action-text)]"
        )}
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
          <path d="M6 4h12v17l-6-4-6 4V4z" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

export default PostActionBar;
