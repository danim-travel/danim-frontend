"use client";

import type { FeedPost } from "@/types";
import FeedCard from "./FeedCard";

interface FeedPanelProps {
  posts: FeedPost[];
  focusedPostId: string | null;
  onSelectPost: (post: FeedPost) => void;
}

export function FeedPanel({ posts, focusedPostId, onSelectPost }: FeedPanelProps) {
  return (
    <aside className="w-[500px] p-7 shrink-0 h-full flex flex-col bg-bg-subtle rounded-2xl overflow-hidden shadow-sm">
      {/* 헤더 */}
      <header className="bg-bg-card mb-5">
        <h2 className="text-section-title font-bold">팔로잉 피드</h2>
      </header>

      {/* 카드 리스트 */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none">
        <div className="flex flex-col gap-4">
          {posts.map((feed) => (
            <FeedCard
              key={feed.post.post_id}
              feed={feed}
              isFocused={focusedPostId === feed.post.post_id}
              onClick={() => onSelectPost(feed)}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}

export default FeedPanel;
