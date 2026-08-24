"use client";
import { Heart, MessageCircle } from "lucide-react";
import { EmptyState, GridSkeleton, GridImage, MasonryGrid } from "@/components/common";
import { usePrefetchPostDetail } from "@/app/(main)/_hooks/usePrefetchPostDetail";
import { cardRatio } from "@/lib/media/imageUtils";

/**
 * 마소너리 그리드에 필요한 최소 공약수 형태.
 * 마이페이지 게시글 탭(UserProfilePost: title 사용)과
 * 저장됨 탭(BookmarkListItem: description 사용) 양쪽이 호출부에서 변환해 사용한다.
 *
 * like_count·comment_count가 함께 들어오면 카드 hover 시 탐색 페이지와 동일한
 * 통계 오버레이를 노출한다. (저장됨 탭 한정 — 게시글 탭 응답엔 통계가 없음)
 *
 * thumbnail_width/height는 선택 필드다. 저장됨 탭 응답(BookmarkListSerializer)에는
 * 아직 크기가 없어서 폴백 비율로 렌더되며, 백엔드가 내려주기 시작하면
 * 호출부 매핑만 추가하면 정확한 비율로 바뀐다.
 */
export type PostGridItem = {
  post_id: string
  thumbnail: string
  alt?: string
  thumbnail_width?: number | null
  thumbnail_height?: number | null
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

  return (
    <MasonryGrid
      items={posts}
      getKey={(post) => post.post_id}
      getRatio={(post) => cardRatio(post.thumbnail_width ?? null, post.thumbnail_height ?? null)}
      // 스크롤 복원(mypage/users 페이지가 querySelector로 찾음)과 e2e 선택자에 쓰인다.
      getItemAttrs={(post) => ({ "data-post-id": post.post_id })}
      onItemClick={onPostClick && ((post) => onPostClick(post.post_id))}
      onItemHover={(post) => prefetchPostDetail(post.post_id)}
      renderItem={(post, i) => {
        // 구조 분해로 좁혀야 아래 StatsOverlay에서 비단정(!) 없이 통과한다.
        const { like_count, comment_count } = post;
        const hasStats = like_count !== undefined && comment_count !== undefined;
        return (
          <>
            <GridImage
              src={post.thumbnail}
              alt={post.alt ?? ""}
              priority={i < 4}
              className={`transition-transform duration-200 ${hasStats ? "group-active:scale-95" : "[@media(hover:hover)]:group-hover:scale-[1.03] group-active:scale-95"}`}
            />
            {hasStats && <StatsOverlay like={like_count} comment={comment_count} />}
          </>
        );
      }}
    />
  );
}

export default PostGrid;
