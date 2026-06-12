"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft } from "lucide-react";
import { EmptyState } from "@/components/common";
import type { MainFeedItem } from "@/types";
import FeedCard from "./FeedCard";

interface FeedPanelProps {
  posts: MainFeedItem[];
  focusedPostId: string | null;
  onSelectPost: (post: MainFeedItem, index: number) => void;
  onOpenModal?: (post: MainFeedItem, index: number) => void;
  onLoadMore?: () => void;
  isLoading?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  title?: string;
  onBack?: () => void;
}

export function FeedPanel({
  posts,
  focusedPostId,
  onSelectPost,
  onOpenModal,
  onLoadMore,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  title,
  onBack,
}: FeedPanelProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !onLoadMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          onLoadMore();
        }
      },
      { root: null, rootMargin: "200px", threshold: 0 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  // observer를 매번 재등록해 최신 클로저를 참조하고 hasNextPage/isFetchingNextPage 변경 시 중복 fetch를 방지한다
  }, [onLoadMore, hasNextPage, isFetchingNextPage]);

  return (
    <aside className="w-(--panel-width) p-7 shrink-0 h-full flex flex-col bg-bg-subtle rounded-2xl overflow-hidden shadow-sm">
      {/* 헤더 */}
      <header className="mb-5 relative">
        {/* h2를 먼저 두어 키보드·스크린리더 포커스 순서가 시각 순서와 일치하도록 한다 */}
        <h2 className="text-section-title font-bold">{title ?? "팔로잉 피드"}</h2>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="absolute right-0 top-0 flex items-center gap-1 text-caption text-text-muted hover:text-text transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            돌아가기
          </button>
        )}
      </header>

      {/* 카드 리스트 */}
      <div data-testid="feed-list" className="flex-1 min-h-0 overflow-y-auto scrollbar-none">
        {posts.length === 0 && !isLoading && !isFetchingNextPage && (
          <div className="h-full flex items-center justify-center">
            <EmptyState title="팔로우한 사람의 게시글이 없습니다." />
          </div>
        )}
        <div className="flex flex-col gap-4">
          {posts.map((feed, index) => (
            <FeedCard
              key={feed.post.post_id}
              feed={feed}
              isFocused={focusedPostId === feed.post.post_id}
              onClick={() => onSelectPost(feed, index)}
              onCommentClick={() => onOpenModal?.(feed, index)}
            />
          ))}

          {/* 무한 스크롤 sentinel */}
          <div ref={sentinelRef} className="h-1" />

          {isFetchingNextPage && (
            <div data-testid="feed-loading-spinner" className="flex justify-center py-4">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          )}

          {!hasNextPage && posts.length > 0 && (
            <p data-testid="feed-end" className="text-center text-body-sm text-text-muted py-4">
              마지막 게시글입니다
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}

export default FeedPanel;
