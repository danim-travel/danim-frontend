"use client";
import { Spinner } from "@/components/ui/spinner";
import { getApiErrorMessage } from "@/lib/apiError";
import { useInfiniteScrollSentinel } from "@/hooks/useInfiniteScrollSentinel";
import PostGrid, { type PostGridItem } from "./PostGrid";

interface BookmarksTabPanelProps {
  items: PostGridItem[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  onPostClick: (postId: string) => void;
}

export function BookmarksTabPanel({
  items,
  isLoading,
  isError,
  error,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onPostClick,
}: BookmarksTabPanelProps) {
  const sentinelRef = useInfiniteScrollSentinel({
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
  });

  if (isLoading) {
    return (
      <PostGrid
        posts={[]}
        isLoading={true}
        onPostClick={onPostClick}
        emptyTitle="저장된 게시글이 없어요"
        emptyDescription="마음에 드는 게시글을 북마크해보세요."
      />
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-text-muted">
          {getApiErrorMessage(error, { client: "저장된 게시글을 불러오지 못했어요." })}
        </p>
      </div>
    );
  }

  return (
    <>
      <PostGrid
        posts={items}
        onPostClick={onPostClick}
        emptyTitle="저장된 게시글이 없어요"
        emptyDescription="마음에 드는 게시글을 북마크해보세요."
      />
      {hasNextPage && (
        <div ref={sentinelRef} className="h-1" aria-hidden />
      )}
      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-6">
          <Spinner size="sm" />
        </div>
      )}
    </>
  );
}

export default BookmarksTabPanel;
