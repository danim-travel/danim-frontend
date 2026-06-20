"use client"
import Image from "next/image"
import { Heart, MessageCircle } from "lucide-react"
import { EmptyState, GridSkeleton } from "@/components/common"

import { Spinner } from "@/components/ui/spinner"
import { useInfiniteScrollSentinel } from "@/hooks/useInfiniteScrollSentinel"
import { usePrefetchPostDetail } from "@/app/(main)/_hooks/usePrefetchPostDetail"
import { GRID_ASPECT_RATIOS } from "@/lib/imageUtils"
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
      <div data-testid="explore-grid" className="columns-2 md:columns-3 lg:columns-4 gap-3">
        {posts.map((post, i) => (
          <div
            key={post.post_id}
            data-testid="explore-post-card"
            className="mb-3 break-inside-avoid cursor-pointer group"
            onClick={() => onPostClick(post.post_id)}
            onMouseEnter={() => prefetchPostDetail(post.post_id)}
          >
            <div className={`relative rounded-xl overflow-hidden bg-bg-subtle ${GRID_ASPECT_RATIOS[i % GRID_ASPECT_RATIOS.length]}`}>
              <Image
                src={post.thumbnail}
                alt=""
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-(--color-overlay) opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <span className="flex items-center gap-1 text-(color:--color-text-inverse) text-body-sm font-medium">
                  <Heart size={14} fill="currentColor" strokeWidth={0} />
                  {post.like_count}
                </span>
                <span className="flex items-center gap-1 text-(color:--color-text-inverse) text-body-sm font-medium">
                  <MessageCircle size={14} fill="currentColor" strokeWidth={0} />
                  {post.comment_count}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div ref={sentinelRef} className="h-1" />

      {isFetchingNextPage && <GridSkeleton count={4} />}
    </>
  )
}
