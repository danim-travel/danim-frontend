"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import PostModal from "@/components/PostModal";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import type { MainFeedItem, PostDetail } from "@/types";
import FeedPanel from "./_components/FeedPanel";
import MapPanel from "./_components/MapPanel";
import { useMainFeed } from "./_hooks/useMainFeed";
import { usePrefetchPostDetail } from "./_hooks/usePrefetchPostDetail";

function toFeedItem(d: PostDetail): MainFeedItem {
  return {
    user: d.user,
    post: { post_id: d.post.post_id, thumbnail: d.post.thumbnail, description: d.post.description },
    spots: d.spots.map((s) => ({ spot_id: s.spot_id, location: s.location, order: s.order })),
    spot_count: d.spots.length,
    comment_count: d.comment_count,
    like_count: d.like_count,
    is_liked: d.is_liked,
    is_bookmarked: d.is_bookmarked,
  }
}

export default function HomePage() {
  const router = useRouter();
  const [focusedPost, setFocusedPost] = useState<MainFeedItem | null>(null);
  const [focusedPostIndex, setFocusedPostIndex] = useState(0);
  const [spotIdx, setSpotIdx] = useState<number | undefined>(undefined);

  const [postId, setPostId] = useQueryState("post", parseAsString);
  const [soloPostId] = useQueryState("solo", parseAsString);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useMainFeed();
  const prefetchPostDetail = usePrefetchPostDetail();

  // soloPostId가 없을 때 queryKeys.posts.detail("")로 빈 캐시 항목이 생기지 않도록 키를 조건부 구성
  const { data: soloDetail } = useQuery({
    queryKey: soloPostId ? queryKeys.posts.detail(soloPostId) : ["_disabled"],
    queryFn: () => apiClient.get(`posts/${soloPostId}`).json<PostDetail>(),
    enabled: !!soloPostId,
    refetchOnWindowFocus: false,
  });

  const soloFeedItem = useMemo(() => (soloDetail ? toFeedItem(soloDetail) : null), [soloDetail]);
  const posts = soloFeedItem ? [soloFeedItem] : (data?.pages.flatMap((p) => p.results) ?? []);

  // solo 모드일 때는 해당 게시글이 항상 지도 포커스 대상
  const activeFocusedPost = soloFeedItem ?? focusedPost;
  const activeFocusedPostIndex = soloFeedItem ? 0 : focusedPostIndex;

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
        focusedPostId={activeFocusedPost?.post.post_id ?? null}
        onSelectPost={handleSelectPost}
        onOpenModal={handleOpenModal}
        onLoadMore={handleLoadMore}
        isLoading={isLoading && !soloPostId}
        hasNextPage={soloPostId ? false : hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        title={soloPostId ? "피드" : undefined}
        onBack={soloPostId ? () => router.back() : undefined}
      />
      <MapPanel
        focusedPost={activeFocusedPost}
        focusedPostIndex={activeFocusedPostIndex}
        onPinClick={handlePinClick}
        onResetFocus={() => setFocusedPost(null)}
      />

      <AnimatePresence>
        {postId && (
          <PostModal
            postId={postId}
            initialSpotIdx={spotIdx}
            onClose={handleCloseModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
