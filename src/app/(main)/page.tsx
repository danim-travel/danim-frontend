"use client";

import { useCallback, useState } from "react";
import PostModal from "@/components/PostModal";
import { useUIStore } from "@/store/uiStore";
import type { MainFeedItem } from "@/types";
import FeedPanel from "./_components/FeedPanel";
import MapPanel from "./_components/MapPanel";
import { useMainFeed } from "./_hooks/useMainFeed";
import { usePrefetchPostDetail } from "./_hooks/usePrefetchPostDetail";

export default function HomePage() {
  const [focusedPost, setFocusedPost] = useState<MainFeedItem | null>(null);
  const [focusedPostIndex, setFocusedPostIndex] = useState(0);
  const postModalId = useUIStore((s) => s.postModalId);
  const openPostModal = useUIStore((s) => s.openPostModal);
  const closePostModal = useUIStore((s) => s.closePostModal);

  const postModalSpotIdx = useUIStore((s) => s.postModalSpotIdx);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useMainFeed();
  const posts = data?.pages.flatMap((p) => p.results) ?? [];
  const prefetchPostDetail = usePrefetchPostDetail();

  const handleSelectPost = useCallback((post: MainFeedItem, index: number) => {
    setFocusedPost(post);
    setFocusedPostIndex(index);
    prefetchPostDetail(post.post.post_id);
  }, [prefetchPostDetail]);

  // 댓글 아이콘 클릭: 해당 게시글 포커스 + 모달 오픈
  const handleOpenModal = useCallback((post: MainFeedItem, index: number) => {
    setFocusedPost(post);
    setFocusedPostIndex(index);
    openPostModal(post.post.post_id);
  }, [openPostModal]);

  // 지도 핀 클릭: 이미 포커스된 게시글의 특정 스팟(pinIndex)에서 모달 오픈
  const handlePinClick = useCallback((postId: string, spotIdx: number) => {
    openPostModal(postId, spotIdx);
  }, [openPostModal]);

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

      {postModalId && (
        <PostModal
          postId={postModalId}
          initialSpotIdx={postModalSpotIdx}
          onClose={closePostModal}
        />
      )}
    </div>
  );
}
