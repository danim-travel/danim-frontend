"use client";
import Image from "next/image";
import { EmptyState } from "@/components/common";
import { usePrefetchPostDetail } from "@/app/(main)/_hooks/usePrefetchPostDetail";
import type { UserProfilePost } from "@/types";

export interface PostGridProps {
  posts: UserProfilePost[];
  onPostClick?: (postId: string) => void;
}

export function PostGrid({ posts, onPostClick }: PostGridProps) {
  const prefetchPostDetail = usePrefetchPostDetail();

  if (posts.length === 0) {
    return (
      <EmptyState
        title="아직 작성한 게시글이 없어요"
        description="첫 여행 기록을 작성해보세요."
      />
    );
  }

  const desktopCols: typeof posts[] = [[], [], [], []];
  posts.forEach((post, i) => desktopCols[i % 4].push(post));

  return (
    <>
      <div className="columns-2 gap-3 md:hidden">
        {posts.map((post) => (
          <div key={post.post_id} data-post-id={post.post_id} className="mb-3 break-inside-avoid cursor-pointer" onClick={() => onPostClick?.(post.post_id)}>
            {/* 외부 이미지 URL 가변 도메인이라 next/image 대신 native img 사용 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.thumbnail}
              alt={post.title}
              className="w-full h-auto rounded-xl block"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      <div className="hidden md:grid md:grid-cols-4 md:gap-3 md:items-start">
        {desktopCols.map((col, colIdx) => (
          <div key={colIdx} className="flex flex-col gap-3">
            {col.map((post, rowIdx) => (
              <div
                key={post.post_id}
                data-post-id={post.post_id}
                className="cursor-pointer"
                onClick={() => onPostClick?.(post.post_id)}
                onMouseEnter={() => prefetchPostDetail(post.post_id)}
              >
                <Image
                  src={post.thumbnail}
                  alt={post.title}
                  width={400}
                  height={300}
                  sizes="25vw"
                  className="w-full h-auto rounded-xl block"
                  priority={rowIdx === 0}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

export default PostGrid;
