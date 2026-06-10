"use client";

import { useCallback, useState } from "react";
import PostModal from "@/components/PostModal";
import { useUIStore } from "@/store/uiStore";
import type { MainFeedItem } from "@/types";
import FeedPanel from "./_components/FeedPanel";
import MapPanel from "./_components/MapPanel";
import { useMainFeed } from "./_hooks/useMainFeed";

export default function HomePage() {
  const [focusedPost, setFocusedPost] = useState<MainFeedItem | null>(null);
  const postModalId = useUIStore((s) => s.postModalId);
  const openPostModal = useUIStore((s) => s.openPostModal);
  const closePostModal = useUIStore((s) => s.closePostModal);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useMainFeed();
  const posts = data?.pages.flatMap((p) => p.results) ?? [];

  const handleSelectPost = useCallback((post: MainFeedItem) => {
    setFocusedPost(post);
  }, []);

  const handleLoadMore = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  return (
    <div className="flex h-full gap-4 p-4 bg-bg">
      <FeedPanel
        posts={posts}
        focusedPostId={focusedPost?.post.post_id ?? null}
        onSelectPost={handleSelectPost}
        onLoadMore={handleLoadMore}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />
      <MapPanel
        focusedPost={focusedPost}
        onPinClick={openPostModal}
        onResetFocus={() => setFocusedPost(null)}
      />

      {postModalId && <PostModal postId={postModalId} onClose={closePostModal} />}
    </div>
  );
}
