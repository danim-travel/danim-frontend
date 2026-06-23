"use client";

import { memo, useEffect, useRef, useState, type RefObject } from "react";
import { ChevronDown } from "lucide-react";
import type { Comment } from "@/types";
import { EmptyState } from "@/components/common";
import CommentItem from "./CommentItem";
import { usePostModalContext } from "./PostModalContext";

interface Props {
  comments: Comment[] | undefined;
  commentCount: number;
  scrollAreaRef: RefObject<HTMLDivElement | null>;
}

const AT_BOTTOM_TOLERANCE_PX = 4;

function CommentSection({ comments, commentCount, scrollAreaRef }: Props) {
  const {
    currentUserId,
    toggleCommentLike,
    onUpdateComment,
    onDeleteComment,
  } = usePostModalContext();

  const listRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const isMountedRef = useRef(false);
  const prevCountRef = useRef(0);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const newCount = comments?.length ?? 0;

    if (isMountedRef.current && newCount > prevCountRef.current) {
      const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
      requestAnimationFrame(() => {
        // 내부 댓글 리스트 최상단 (새 댓글이 최신순 상단에 위치)
        el.scrollTop = 0;

        if (!isDesktop) {
          // 모바일/태블릿: 외부 스크롤을 CommentSection 상단으로 이동
          const outer = scrollAreaRef.current;
          const section = sectionRef.current;
          if (outer && section) {
            const diff = section.getBoundingClientRect().top - outer.getBoundingClientRect().top;
            outer.scrollTop = outer.scrollTop + diff;
          }
        }
      });
    }

    isMountedRef.current = true;
    prevCountRef.current = newCount;
    setIsAtBottom(el.scrollHeight <= el.clientHeight + AT_BOTTOM_TOLERANCE_PX);
  }, [comments, scrollAreaRef]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    setIsAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - AT_BOTTOM_TOLERANCE_PX);
  };

  return (
    <div ref={sectionRef} className="mt-auto pt-1 border-t border-border-subtle">
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

export default memo(CommentSection);
