"use client";

import type { Comment } from "@/types";
import CommentItem from "./CommentItem";
import { usePostModalContext } from "./PostModalContext";

interface Props {
  comments: Comment[] | undefined;
  commentCount: number;
}

export default function CommentSection({ comments, commentCount }: Props) {
  const {
    currentUserId,
    toggleCommentLike,
    onUpdateComment,
    onDeleteComment,
  } = usePostModalContext();

  return (
    <div className="mt-auto pt-1 border-t border-border-subtle">
      <span className="text-caption font-semibold text-text-muted uppercase tracking-wide">댓글</span>
      <span className="ml-2 text-text-emphasis text-caption font-semibold">{commentCount}개</span>
      <div className="h-[190px] divide-y divide-border-subtle overflow-y-auto scrollbar-none">
        {comments?.map((c) => (
          <CommentItem
            key={c.comment_id}
            comment={c}
            isOwn={!!currentUserId && c.user.id === currentUserId}
            onLike={() => toggleCommentLike(c.comment_id, c.is_liked)}
            onEdit={(content) => onUpdateComment(c.comment_id, content)}
            onDelete={() => onDeleteComment(c.comment_id)}
          />
        ))}
      </div>
    </div>
  );
}
