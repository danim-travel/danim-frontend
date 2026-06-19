"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Comment } from "@/types";
import { EmptyState } from "@/components/common";
import CommentItem from "./CommentItem";
import { usePostModalContext } from "./PostModalContext";

interface Props {
  comments: Comment[] | undefined;
  commentCount: number;
}

const AT_BOTTOM_TOLERANCE_PX = 4;

export default function CommentSection({ comments, commentCount }: Props) {
  const {
    currentUserId,
    toggleCommentLike,
    onUpdateComment,
    onDeleteComment,
  } = usePostModalContext();

  const listRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);

  // 댓글 목록이 바뀔 때 스크롤 넘침 여부 재측정
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    setIsAtBottom(el.scrollHeight <= el.clientHeight + AT_BOTTOM_TOLERANCE_PX);
  }, [comments]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    setIsAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - AT_BOTTOM_TOLERANCE_PX);
  };

  return (
    <div className="mt-auto pt-1 border-t border-border-subtle">
      <span className="text-caption font-semibold text-text-muted uppercase tracking-wide">댓글</span>
      <span className="ml-2 text-text-emphasis text-caption font-semibold">{commentCount}개</span>

      <div className="relative">
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="h-[190px] divide-y divide-border-subtle overflow-y-auto scrollbar-none"
        >
          {!comments ? null : comments.length === 0 ? (
            <EmptyState title="첫 댓글을 남겨보세요" />
          ) : (
            comments.map((c) => (
              <CommentItem
                key={c.comment_id}
                comment={c}
                isOwn={!!currentUserId && c.user.id === currentUserId}
                onLike={(wasLiked) => toggleCommentLike(c.comment_id, wasLiked)}
                onEdit={(content) => onUpdateComment(c.comment_id, content)}
                onDelete={() => onDeleteComment(c.comment_id)}
              />
            ))
          )}
        </div>

        {/* 스크롤 가능 표시 */}
        {!isAtBottom && (
          <div className="absolute bottom-0 left-0 right-0 h-8 flex items-end justify-center pb-1 bg-gradient-to-t from-bg-card to-transparent pointer-events-none">
            <ChevronDown size={14} className="text-text-muted" />
          </div>
        )}
      </div>
    </div>
  );
}
