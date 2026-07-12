"use client";

import { memo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/common";
import { cn } from "@/lib/utils";
import { extractRegion } from "@/lib/region";
import { queryKeys } from "@/lib/queryKeys";
import { useLikeMutation } from "@/hooks/interactions/useLikeMutation";
import { useBookmarkMutation } from "@/hooks/interactions/useBookmarkMutation";
import { useDebouncedToggle } from "@/hooks/async/useDebouncedToggle";
import { updateFeedItem, type FeedCache } from "@/lib/feedCache";
import { usePrefetchPostDetail } from "../_hooks/usePrefetchPostDetail";
import { FeedCardHeader } from "./FeedCardHeader";
import { FeedCardImage } from "./FeedCardImage";
import { FeedCardActions } from "./FeedCardActions";
import type { MainFeedItem, PostDetail } from "@/types";

interface FeedCardProps {
  feed: MainFeedItem;
  isFocused: boolean;
  onClick: () => void;
  onCommentClick?: () => void;
  priority?: boolean;
  variant?: "panel" | "sheet";
}

// 카드 내부에서만 펼침/접기 상태를 가지는 description — 카드 외부 너비엔 영향 없음(높이만 가변)
function ExpandableDescription({ text, clampClass }: { text: string; clampClass: string }) {
  const [expanded, setExpanded] = useState(false);
  // 잘림 여부 판정 — 폰트 메트릭 의존 없이 글자 수 기준으로 보수적 추정. 짧으면 토글 자체를 노출하지 않아 UI 노이즈 방지
  const mayOverflow = text.length > 60;

  return (
    <div className="flex-1 min-w-0">
      <p className={`text-body-sm text-text-secondary break-words ${expanded ? "" : clampClass}`}>{text}</p>
      {mayOverflow && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          className="mt-1 text-nav font-medium text-primary hover:text-primary/70 transition-colors"
        >
          {expanded ? "접기" : "더보기"}
        </button>
      )}
    </div>
  );
}

export function FeedCard({
  feed,
  isFocused,
  onClick,
  onCommentClick,
  priority = false,
  variant = "panel",
}: FeedCardProps) {
  const addressName = feed.spots[0]?.location.address_name ?? "";
  const region = addressName ? extractRegion(addressName) : "";
  const queryClient = useQueryClient();
  const feedQueryKey = queryKeys.posts.mainFeed;
  const prefetchPostDetail = usePrefetchPostDetail();

  // 모달 상세 캐시 키 — onAfterSuccess에서 피드↔모달 상태를 양방향 동기화할 때 사용
  const detailKey = queryKeys.posts.detail(feed.post.post_id);

  const likeMutation = useLikeMutation<FeedCache>({
    buildEndpoint: () => `posts/${feed.post.post_id}/like`,
    queryKey: feedQueryKey,
    optimisticUpdater: (old, { wasLiked }) =>
      updateFeedItem(old, feed.post.post_id, (item) => ({
        ...item,
        is_liked: !wasLiked,
        like_count: item.like_count + (wasLiked ? -1 : 1),
      })),
    successUpdater: (old, res) =>
      updateFeedItem(old, feed.post.post_id, (item) => ({
        ...item,
        is_liked: res.is_liked,
        like_count: res.like_count,
      })),
    onAfterSuccess: (res) => {
      queryClient.setQueryData<PostDetail>(detailKey, (old) => {
        if (!old) return old;
        return { ...old, is_liked: res.is_liked, like_count: res.like_count };
      });
    },
  });

  const bookmarkMutation = useBookmarkMutation<FeedCache>({
    buildEndpoint: () => `posts/${feed.post.post_id}/bookmark`,
    queryKey: feedQueryKey,
    optimisticUpdater: (old, wasBookmarked) =>
      updateFeedItem(old, feed.post.post_id, (item) => ({
        ...item,
        is_bookmarked: !wasBookmarked,
      })),
    successUpdater: (old, res) =>
      updateFeedItem(old, feed.post.post_id, (item) => ({
        ...item,
        is_bookmarked: res.is_bookmarked,
      })),
    onAfterSuccess: (res) => {
      queryClient.setQueryData<PostDetail>(detailKey, (old) => {
        if (!old) return old;
        return { ...old, is_bookmarked: res.is_bookmarked };
      });
    },
  });

  // 디바운스 + net-zero: UI는 즉시 토글, mutation은 마지막 의도만 1회 호출
  const { localState: isLiked, toggle: toggleLikeDebounced, countDelta: likeDelta } = useDebouncedToggle({
    serverState: feed.is_liked,
    onCommit: (wasLiked) => {
      if (!likeMutation.isPending) {
        likeMutation.mutate({ wasLiked })
      }
    },
  });

  const { localState: isBookmarked, toggle: toggleBookmarkDebounced } = useDebouncedToggle({
    serverState: feed.is_bookmarked,
    onCommit: (wasBookmarked) => {
      if (!bookmarkMutation.isPending) {
        bookmarkMutation.mutate(wasBookmarked)
      }
    },
  });

  const likeCountDisplay = feed.like_count + likeDelta;

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLikeDebounced();
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmarkDebounced();
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCommentClick?.();
  };

  if (variant === "sheet") {
    return (
      <Card
        variant="elevated"
        padding="none"
        onClick={onClick}
        data-testid="feed-card"
        className={cn(
          "flex flex-row overflow-hidden border-2 transition-colors cursor-pointer",
          isFocused ? "border-primary" : "border-transparent [@media(hover:hover)]:hover:border-primary/70"
        )}
      >
        {/* 사진 영역 — 카드 너비의 1/2 */}
        <FeedCardImage
          thumbnail={feed.post.thumbnail}
          description={feed.post.description}
          spotCount={feed.spot_count}
          variant="sheet"
        />

        {/* 텍스트 영역 — 카드 너비의 1/2 */}
        <div className="w-1/2 p-3 flex flex-col gap-2 min-w-0">
          <FeedCardHeader
            nickname={feed.user.nickname}
            profileImg={feed.user.profile_img}
            region={region}
            variant="sheet"
          />

          {/* 설명 */}
          <ExpandableDescription text={feed.post.description} clampClass="line-clamp-2" />

          <FeedCardActions
            isLiked={isLiked}
            likeCountDisplay={likeCountDisplay}
            commentCount={feed.comment_count}
            isBookmarked={isBookmarked}
            onLikeClick={handleLikeClick}
            onCommentClick={handleCommentClick}
            onBookmarkClick={handleBookmarkClick}
            variant="sheet"
          />
        </div>
      </Card>
    );
  }

  return (
    <Card
      variant="elevated"
      padding="none"
      onClick={onClick}
      onMouseEnter={() => prefetchPostDetail(feed.post.post_id)}
      data-testid="feed-card"
      className={cn(
        "overflow-hidden border-2 transition-colors cursor-pointer",
        isFocused ? "border-primary" : "border-transparent [@media(hover:hover)]:hover:border-primary/70"
      )}
    >
      {/* 썸네일 */}
      <FeedCardImage
        thumbnail={feed.post.thumbnail}
        description={feed.post.description}
        spotCount={feed.spot_count}
        priority={priority}
        variant="panel"
      />

      {/* 본문 영역 */}
      <div className="p-4 flex flex-col gap-3">
        <FeedCardHeader
          nickname={feed.user.nickname}
          profileImg={feed.user.profile_img}
          region={region}
          variant="panel"
        />

        {/* 설명 */}
        <ExpandableDescription text={feed.post.description} clampClass="line-clamp-2" />

        <hr className="border-border" />

        <FeedCardActions
          isLiked={isLiked}
          likeCountDisplay={likeCountDisplay}
          commentCount={feed.comment_count}
          isBookmarked={isBookmarked}
          onLikeClick={handleLikeClick}
          onCommentClick={handleCommentClick}
          onBookmarkClick={handleBookmarkClick}
          variant="panel"
        />
      </div>
    </Card>
  );
}

export default memo(FeedCard);
