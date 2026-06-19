"use client";
import Image from "next/image";
import { Heart, MessageCircle } from "lucide-react";
import { EmptyState } from "@/components/common";
import { usePrefetchPostDetail } from "@/app/(main)/_hooks/usePrefetchPostDetail";

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
  emptyTitle = "아직 작성한 게시글이 없어요",
  emptyDescription = "첫 여행 기록을 작성해보세요.",
}: PostGridProps) {
  const prefetchPostDetail = usePrefetchPostDetail();

  if (posts.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  const desktopCols: typeof posts[] = [[], [], [], []];
  posts.forEach((post, i) => desktopCols[i % 4].push(post));

  return (
    <>
      <div className="columns-2 gap-3 md:hidden">
        {posts.map((post) => {
          const hasStats = post.like_count !== undefined && post.comment_count !== undefined;
          return (
            <div key={post.post_id} data-post-id={post.post_id} className="mb-3 break-inside-avoid cursor-pointer group" onClick={() => onPostClick?.(post.post_id)}>
              <div className="relative rounded-xl overflow-hidden">
                {/* 외부 이미지 URL 가변 도메인이라 next/image 대신 native img 사용 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.thumbnail}
                  alt={post.alt ?? ""}
                  className="w-full h-auto block transition-transform duration-200 group-active:scale-95"
                  loading="lazy"
                />
                {hasStats && <StatsOverlay like={post.like_count!} comment={post.comment_count!} />}
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden md:grid md:grid-cols-4 md:gap-3 md:items-start">
        {desktopCols.map((col, colIdx) => (
          <div key={colIdx} className="flex flex-col gap-3">
            {col.map((post, rowIdx) => {
              const hasStats = post.like_count !== undefined && post.comment_count !== undefined;
              return (
                <div
                  key={post.post_id}
                  data-post-id={post.post_id}
                  className="cursor-pointer group"
                  onClick={() => onPostClick?.(post.post_id)}
                  onMouseEnter={() => prefetchPostDetail(post.post_id)}
                >
                  <div className="relative rounded-xl overflow-hidden">
                    <Image
                      src={post.thumbnail}
                      alt={post.alt ?? ""}
                      width={400}
                      height={300}
                      sizes="25vw"
                      className={`w-full h-auto block transition-transform duration-200 ${hasStats ? "" : "group-hover:scale-[1.03]"}`}
                      priority={rowIdx === 0 && colIdx < 2}
                    />
                    {hasStats && <StatsOverlay like={post.like_count!} comment={post.comment_count!} />}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}

export default PostGrid;
