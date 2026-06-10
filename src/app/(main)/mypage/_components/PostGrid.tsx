"use client";
import { EmptyState } from "@/components/common";
import type { UserProfilePost } from "@/types";

export interface PostGridProps {
  posts: UserProfilePost[];
}

export function PostGrid({ posts }: PostGridProps) {
  if (posts.length === 0) {
    return (
      <EmptyState
        title="아직 작성한 게시글이 없어요"
        description="첫 여행 기록을 작성해보세요."
      />
    );
  }

  return (
    <div className="columns-4 gap-3">
      {posts.map((post) => (
        <div key={post.post_id} className="mb-3 break-inside-avoid cursor-pointer">
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
  );
}

export default PostGrid;
