"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useUIStore } from "@/store/uiStore";
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
import MobileBottomSheet from "./_components/MobileBottomSheet";
import { useMainFeed } from "./_hooks/useMainFeed";
import { usePrefetchPostDetail } from "./_hooks/usePrefetchPostDetail";
import { useCurrentPosition } from "./_hooks/useCurrentPosition";

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
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [sheetY, setSheetY] = useState<number | null>(null);

  const closePanel = useUIStore((s) => s.closePanel);
  const [postId, setPostId] = useQueryState("post", parseAsString);
  const [soloPostId] = useQueryState("solo", parseAsString);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useMainFeed();
  const prefetchPostDetail = usePrefetchPostDetail();
  const { coords, handleLocationResolved } = useCurrentPosition();

  // soloPostId가 없을 때 queryKeys.posts.detail("")로 빈 캐시 항목이 생기지 않도록 키를 조건부 구성
  const { data: soloDetail } = useQuery({
    queryKey: soloPostId ? queryKeys.posts.detail(soloPostId) : queryKeys.disabled,
    queryFn: () => apiClient.get(`posts/${soloPostId}`).json<PostDetail>(),
    enabled: !!soloPostId,
    refetchOnWindowFocus: false,
    // 모달에서 이미 fetch한 데이터가 캐시에 있으므로 30초간 fresh로 유지
    // staleTime=0(기본)이면 캐시 히트여도 즉시 백그라운드 재요청이 나가
    // 첫 렌더에서 soloFeedItem=null이 되는 타이밍이 생겨 마커가 안 찍히는 경우가 있음
    staleTime: 30_000,
  });

  const soloFeedItem = useMemo(() => (soloDetail ? toFeedItem(soloDetail) : null), [soloDetail]);
  const posts = useMemo(
    () => (soloFeedItem ? [soloFeedItem] : (data?.pages.flatMap((p) => p.results) ?? [])),
    [soloFeedItem, data],
  );


  // solo 모드일 때는 해당 게시글이 항상 지도 포커스 대상
  const activeFocusedPost = soloFeedItem ?? focusedPost;
  const activeFocusedPostIndex = soloFeedItem ? 0 : focusedPostIndex;

  const handleSelectPost = useCallback((post: MainFeedItem, index: number) => {
    setFocusedPost(post);
    setFocusedPostIndex(index);
    prefetchPostDetail(post.post.post_id);
    setSheetExpanded(false); // 게시글 선택 시 반반으로 축소
  }, [prefetchPostDetail]);

  const handleOpenModal = useCallback((post: MainFeedItem, index: number) => {
    closePanel();
    setFocusedPost(post);
    setFocusedPostIndex(index);
    setSpotIdx(undefined);
    setPostId(post.post.post_id);
  }, [closePanel, setPostId]);

  const handlePinClick = useCallback((id: string, idx: number) => {
    closePanel();
    setSpotIdx(idx);
    setPostId(id);
  }, [closePanel, setPostId]);

  // 주변 기록은 스팟 단위가 아니라 게시글 단위로 열린다 — spotIdx 없음.
  const handleOpenNearbyPost = useCallback((id: string) => {
    closePanel();
    setSpotIdx(undefined);
    setPostId(id);
  }, [closePanel, setPostId]);

  const handleCloseModal = useCallback(() => {
    setPostId(null);
    setSpotIdx(undefined);
  }, [setPostId]);

  const handleLoadMore = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  const feedPanelProps = {
    posts,
    focusedPostId: activeFocusedPost?.post.post_id ?? null,
    onSelectPost: handleSelectPost,
    onOpenModal: handleOpenModal,
    onLoadMore: handleLoadMore,
    isLoading: isLoading && !soloPostId,
    hasNextPage: soloPostId ? false : hasNextPage,
    isFetchingNextPage,
    title: soloPostId ? "피드" : undefined,
    onBack: soloPostId ? () => router.back() : undefined,
    hideEndMessage: !!soloPostId,
  } as const;

  return (
    <div className="h-full md:flex md:flex-row md:gap-4 md:p-4 md:bg-bg">
      {/* 데스크탑: 좌측 피드 패널 */}
      <div className="hidden md:block md:w-[45%] md:shrink-0 md:h-full">
        <FeedPanel {...feedPanelProps} variant="panel" />
      </div>

      {/* 지도: 모바일=바텀시트 위쪽만큼, 데스크탑=우측 flex-1 (inline height는 md:!h-full로 무력화) */}
      <div
        className="md:flex-1 md:min-h-0 md:h-full!"
        style={sheetY != null ? { height: `${sheetY}px` } : { height: "100%" }}
      >
        <MapPanel
          focusedPost={activeFocusedPost}
          focusedPostIndex={activeFocusedPostIndex}
          onPinClick={handlePinClick}
          onResetFocus={() => { setFocusedPost(null); setSheetExpanded(false); }}
          coords={coords}
          onLocationResolved={handleLocationResolved}
          onOpenNearbyPost={handleOpenNearbyPost}
          isSoloMode={!!soloPostId}
        />
      </div>

      {/* 모바일: 피드 바텀시트 */}
      <div className="md:hidden">
        <MobileBottomSheet
          expanded={sheetExpanded}
          onExpandedChange={setSheetExpanded}
          onYChange={setSheetY}
        >
          <FeedPanel {...feedPanelProps} variant="sheet" />
        </MobileBottomSheet>
      </div>

      <AnimatePresence>
        {postId && (
          <PostModal
            postId={postId}
            initialSpotIdx={spotIdx}
            // 활성 카드의 썸네일을 placeholder로 즉시 표시해 로딩 중 회색 깜빡임 방지
            placeholderThumbnail={activeFocusedPost?.post.thumbnail}
            onClose={handleCloseModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
