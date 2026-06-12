"use client";

import { useCallback, useState } from "react";
import { parseAsString, useQueryState } from "nuqs";
import PostModal from "@/components/PostModal";
import type { MainFeedItem } from "@/types";
import FeedPanel from "./_components/FeedPanel";
import MapPanel from "./_components/MapPanel";
import { useMainFeed } from "./_hooks/useMainFeed";
import { usePrefetchPostDetail } from "./_hooks/usePrefetchPostDetail";

export default function HomePage() {
  const [focusedPost, setFocusedPost] = useState<MainFeedItem | null>(null);
  const [focusedPostIndex, setFocusedPostIndex] = useState(0);
  const [spotIdx, setSpotIdx] = useState<number | undefined>(undefined);

  const [postId, setPostId] = useQueryState("post", parseAsString);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useMainFeed();
  const posts = data?.pages.flatMap((p) => p.results) ?? [];
  const prefetchPostDetail = usePrefetchPostDetail();

  const handleSelectPost = useCallback((post: MainFeedItem, index: number) => {
    setFocusedPost(post);
    setFocusedPostIndex(index);
    prefetchPostDetail(post.post.post_id);
  }, [prefetchPostDetail]);

  const handleOpenModal = useCallback((post: MainFeedItem, index: number) => {
    setFocusedPost(post);
    setFocusedPostIndex(index);
    setSpotIdx(undefined);
    setPostId(post.post.post_id);
  }, [setPostId]);

  const handlePinClick = useCallback((id: string, idx: number) => {
    setSpotIdx(idx);
    setPostId(id);
  }, [setPostId]);

  const handleCloseModal = useCallback(() => {
    setPostId(null);
    setSpotIdx(undefined);
  }, [setPostId]);

  const handleLoadMore = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  return (
    <div className="flex h-full gap-4 p-4 bg-bg">
      <FeedPanel
        posts={posts}
        focusedPostId={focusedPost?.post.post_id ?? null}
        onSelectPost={handleSelectPost}
        onOpenModal={handleOpenModal}
        onLoadMore={handleLoadMore}
        isLoading={isLoading}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />
      <MapPanel
        focusedPost={focusedPost}
        focusedPostIndex={focusedPostIndex}
        onPinClick={handlePinClick}
        onResetFocus={() => setFocusedPost(null)}
      />

      {postId && (
        <PostModal
          postId={postId}
          initialSpotIdx={spotIdx}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
