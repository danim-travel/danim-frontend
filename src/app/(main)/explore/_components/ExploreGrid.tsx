"use client"
import { Heart, MessageCircle } from "lucide-react"
import { EmptyState, GridSkeleton, GridImage, MasonryGrid } from "@/components/common"
import { useInfiniteScrollSentinel } from "@/hooks/async/useInfiniteScrollSentinel"
import { usePrefetchPostDetail } from "@/app/(main)/_hooks/usePrefetchPostDetail"
import { cardRatio } from "@/lib/media/imageUtils"
import type { ExplorePost } from "@/types"

interface ExploreGridProps {
  posts: ExplorePost[]
  isLoading: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onLoadMore: () => void
  onPostClick: (postId: string) => void
}

export function ExploreGrid({
  posts,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onPostClick,
}: ExploreGridProps) {
  const prefetchPostDetail = usePrefetchPostDetail()
  const sentinelRef = useInfiniteScrollSentinel({
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
    rootMargin: '300px',
  })

  if (isLoading) return <GridSkeleton />

  if (posts.length === 0) {
    return (
      <EmptyState
        title="게시글이 없어요"
        description="다른 검색어를 입력해보세요."
      />
    )
  }

  return (
    <>
      <MasonryGrid
        items={posts}
        getKey={(post) => post.post_id}
        getRatio={(post) => cardRatio(post.thumbnail_width, post.thumbnail_height)}
        onItemClick={(post) => onPostClick(post.post_id)}
        onItemHover={(post) => prefetchPostDetail(post.post_id)}
        testId="explore-grid"
        getItemAttrs={() => ({ "data-testid": "explore-post-card" })}
        renderItem={(post, i) => (
          <>
            {/* 첫 행은 탐색 화면의 LCP 후보다. 마이페이지 그리드와 동일하게 우선 로드한다. */}
            <GridImage src={post.thumbnail} alt="게시글 썸네일" priority={i < 4} />
            <div className="absolute inset-0 bg-(--color-overlay) opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 pointer-events-none">
              <span className="flex items-center gap-1 text-(color:--color-text-inverse) text-body-sm font-medium">
                <Heart size={14} fill="currentColor" strokeWidth={0} />
                {post.like_count}
              </span>
              <span className="flex items-center gap-1 text-(color:--color-text-inverse) text-body-sm font-medium">
                <MessageCircle size={14} fill="currentColor" strokeWidth={0} />
                {post.comment_count}
              </span>
            </div>
          </>
        )}
      />

      <div ref={sentinelRef} className="h-1" />

      {isFetchingNextPage && <GridSkeleton count={4} />}
    </>
  )
}
