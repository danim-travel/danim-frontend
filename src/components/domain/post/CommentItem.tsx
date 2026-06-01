import React from "react";
import Avatar from "../../common/Avatar/Avatar";

export interface CommentItemProps { author: { name: string; initial: string; color?: string }; text: string; time: string; likeCount?: number; }

export function CommentItem({ author, text, time, likeCount }: CommentItemProps) {
  return (
    <div className="flex gap-3 py-3">
      <Avatar size="sm" initial={author.initial} color={author.color} />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-text-secondary">
          <b className="text-text">{author.name}</b> {text}
        </div>
        <div className="flex gap-3 mt-1 text-[12px] text-text-muted">
          <span>{time}</span>
          {likeCount != null && <span>좋아요 {likeCount}</span>}
          <span>답글 달기</span>
        </div>
      </div>
    </div>
  );
}

export default CommentItem;
