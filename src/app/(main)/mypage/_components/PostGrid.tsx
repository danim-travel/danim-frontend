"use client";
import Image from "next/image";
import { Heart, MessageCircle } from "lucide-react";
import { EmptyState, GridSkeleton } from "@/components/common";
import { usePrefetchPostDetail } from "@/app/(main)/_hooks/usePrefetchPostDetail";
import { GRID_ASPECT_RATIOS } from "@/lib/imageUtils";

/**
 * 마소너리 그리드에 필요한 최소 공약수 형태.
 * 마이페이지 게시글 탭(UserProfilePost: title 사용)과
 * 저장됨 탭(BookmarkListItem: description 사용) 양쪽이 호출부에서 변환해 사용한다.
 *
 * like_count·comment_count가 함께 들어오면 카드 hover 시 탐색 페이지와 동일한
 * 통계 오버레이를 노출한다. (저장됨 탭 한정 — 게시글 탭 응답엔 통계가 없음)
 */
export type PostGridItem = {
  post_id: string
  thumbnail: string
  alt?: string
  like_count?: number
  comment_count?: number
}

export interface PostGridProps {
  posts: PostGridItem[]
  onPostClick?: (postId: string) => void
  isLoading?: boolean
  /** 빈 상태 메시지를 호출자가 지정할 수 있다 (게시글/저장됨 탭이 다른 문구). */
  emptyTitle?: string
  emptyDescription?: string
}

function StatsOverlay({ like, comment }: { like: number; comment: number }) {
  return (
    <div className="absolute inset-0 bg-(--color-overlay) opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 pointer-events-none">
      <span className="flex items-center gap-1 text-(color:--color-text-inverse) text-body-sm font-medium">
        <Heart size={14} fill="currentColor" strokeWidth={0} />
        {like}
      </span>
      <span className="flex items-center gap-1 text-(color:--color-text-inverse) text-body-sm font-medium">
        <MessageCircle size={14} fill="currentColor" strokeWidth={0} />
        {comment}
      </span>
    </div>
  );
}

export function PostGrid({
  posts,
  onPostClick,
  isLoading = false,
  emptyTitle = "아직 작성한 게시글이 없어요",
  emptyDescription = "첫 여행 기록을 작성해보세요.",
}: PostGridProps) {
  const prefetchPostDetail = usePrefetchPostDetail();

  if (isLoading) return <GridSkeleton />;

  if (posts.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  // 순환 비율 배열 — 실제 이미지 비율을 모를 때 핀터레스트 느낌을 주기 위해 사용
  // CSS columns 기반 통일된 마소너리 그리드 (모바일 2 / 태블릿 3 / 데스크탑 4)

  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-3">
      {posts.map((post, i) => {
        const hasStats = post.like_count !== undefined && post.comment_count !== undefined;
        const aspect = GRID_ASPECT_RATIOS[i % GRID_ASPECT_RATIOS.length]
        return (
          <div
            key={post.post_id}
            data-post-id={post.post_id}
            className="mb-3 break-inside-avoid cursor-pointer group"
            onClick={() => onPostClick?.(post.post_id)}
            onMouseEnter={() => prefetchPostDetail(post.post_id)}
          >
            <div className={`relative rounded-xl overflow-hidden bg-bg-subtle ${aspect}`}>
              <Image
                src={post.thumbnail}
                alt={post.alt ?? ""}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                className={`object-cover transition-transform duration-200 ${hasStats ? "group-active:scale-95" : "[@media(hover:hover)]:group-hover:scale-[1.03] group-active:scale-95"}`}
                priority={i < 4}
              />
              {hasStats && <StatsOverlay like={post.like_count!} comment={post.comment_count!} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default PostGrid;
