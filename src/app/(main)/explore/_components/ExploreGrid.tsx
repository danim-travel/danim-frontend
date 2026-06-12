"use client"
import { useEffect, useRef } from "react"
import { Heart, MessageCircle } from "lucide-react"
import { EmptyState, Skeleton } from "@/components/common"
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
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = sentinelRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) onLoadMore()
      },
      { rootMargin: "300px" },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [onLoadMore, hasNextPage, isFetchingNextPage])

  if (isLoading) {
    return (
      <div className="columns-4 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="mb-3 break-inside-avoid">
            <Skeleton height={[460, 360, 540, 580, 320, 380, 340, 420, 522, 400, 480, 362][i]} radius="card" />
          </div>
        ))}
      </div>
    )
  }

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
      <div className="columns-4 gap-3">
        {posts.map((post) => (
          <div
            key={post.post_id}
            className="mb-3 break-inside-avoid cursor-pointer group"
            onClick={() => onPostClick(post.post_id)}
          >
            <div className="relative rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.thumbnail}
                alt=""
                className="w-full h-auto block"
                loading="lazy"
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

      {isFetchingNextPage && (
        <div className="columns-4 gap-3 mt-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="mb-3 break-inside-avoid">
              <Skeleton height={180} radius="card" />
            </div>
          ))}
        </div>
      )}
    </>
  )
}
