"use client";

import { useState } from "react";
import Image from "next/image";
import { MapPin, Heart, MessageCircle, Bookmark } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, Card } from "@/components/common";
import { cn } from "@/lib/utils";
import { extractRegion } from "@/lib/region";
import { queryKeys } from "@/lib/queryKeys";
import { useLikeMutation } from "@/hooks/useLikeMutation";
import { useBookmarkMutation } from "@/hooks/useBookmarkMutation";
import { useDebouncedToggle } from "@/hooks/useDebouncedToggle";
import { updateFeedItem, type FeedCache } from "@/lib/feedCache";
import { usePrefetchPostDetail } from "../_hooks/usePrefetchPostDetail";
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
          className="mt-1 text-nav font-medium text-text-muted hover:text-text-secondary transition-colors"
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
    onCommit: (wasLiked) => likeMutation.mutate({ wasLiked }),
  });

  const { localState: isBookmarked, toggle: toggleBookmarkDebounced } = useDebouncedToggle({
    serverState: feed.is_bookmarked,
    onCommit: (wasBookmarked) => bookmarkMutation.mutate(wasBookmarked),
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

  if (variant === "sheet") {
    return (
      <Card
        variant="elevated"
        padding="none"
        onClick={onClick}
        data-testid="feed-card"
        className={cn(
          "flex flex-row overflow-hidden border-2 transition-colors cursor-pointer",
          isFocused ? "border-primary" : "border-transparent hover:border-primary/70"
        )}
      >
        {/* 사진 영역 — 카드 너비의 1/2 */}
        <div className="relative w-1/2 self-stretch bg-bg-subtle">
          {feed.post.thumbnail && (
            <Image
              src={feed.post.thumbnail}
              alt={feed.post.description}
              fill
              sizes="50vw"
              loading="eager"
              className="object-cover"
            />
          )}
          {feed.spot_count > 0 && (
            <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-pill bg-white text-label font-semibold shadow-sm shrink-0">
              <MapPin size={10} className="text-primary" />
              <span data-testid="spot-count">{feed.spot_count}</span>
            </div>
          )}
        </div>

        {/* 텍스트 영역 — 카드 너비의 1/2 */}
        <div className="w-1/2 p-3 flex flex-col gap-2 min-w-0">
          {/* 작성자 */}
          <div className="flex items-center gap-2 min-w-0">
            <Avatar
              size="sm"
              src={feed.user.profile_img ?? undefined}
              initial={feed.user.nickname.charAt(0)}
            />
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-base truncate">{feed.user.nickname}</span>
              {region && <span className="text-caption text-text-muted truncate">{region}</span>}
            </div>
          </div>

          {/* 설명 */}
          <ExpandableDescription text={feed.post.description} clampClass="line-clamp-2" />

          {/* 액션 */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              data-testid="like-button"
              onClick={handleLikeClick}
              className="flex items-center gap-1 text-text-muted text-body-sm hover:text-error transition-colors"
            >
              <Heart size={14} className={cn(isLiked && "fill-error text-error")} />
              <span data-testid="like-count">{likeCountDisplay}</span>
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onCommentClick?.(); }}
              className="flex items-center gap-1 text-text-muted text-body-sm hover:text-primary transition-colors"
            >
              <MessageCircle size={14} />
              <span>{feed.comment_count}</span>
            </button>
            <button
              type="button"
              data-testid="bookmark-button"
              onClick={handleBookmarkClick}
              className="ml-auto text-text-muted hover:text-primary transition-colors"
            >
              <Bookmark
                size={14}
                className={cn(isBookmarked && "fill-primary text-primary")}
              />
            </button>
          </div>
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
        isFocused ? "border-primary" : "border-transparent hover:border-primary/70"
      )}
    >
      {/* 썸네일 */}
      <div className="relative w-full aspect-[16/9] bg-bg-subtle">
        {feed.post.thumbnail && (
          <Image
            src={feed.post.thumbnail}
            alt={feed.post.description}
            fill
            sizes="(max-width: 1280px) 50vw, 480px"
            priority={priority}
            className="object-cover"
          />
        )}
        {feed.spot_count > 0 && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-pill bg-white text-text-primary text-label font-semibold shadow-sm shrink-0">
            <MapPin size={12} className="text-primary" />
            <span data-testid="spot-count">{feed.spot_count}</span>
          </div>
        )}
      </div>

      {/* 본문 영역 */}
      <div className="p-4 flex flex-col gap-3">
        {/* 작성자 */}
        <div className="flex items-center gap-3">
          <Avatar
            size="sm"
            src={feed.user.profile_img ?? undefined}
            initial={feed.user.nickname.charAt(0)}
          />
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-base truncate">{feed.user.nickname}</span>
            {region && <span className="text-body-sm text-text-muted">{region}</span>}
          </div>
        </div>

        {/* 설명 */}
        <ExpandableDescription text={feed.post.description} clampClass="line-clamp-2" />

        <hr className="border-border" />

        {/* 액션 */}
        <div className="flex items-center gap-4 pt-1">
          <button
            type="button"
            data-testid="like-button"
            onClick={handleLikeClick}
            className="flex items-center gap-1 text-text-muted text-body-sm hover:text-error transition-colors"
          >
            <Heart size={16} className={cn(isLiked && "fill-error text-error")} />
            <span data-testid="like-count">{likeCountDisplay}</span>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onCommentClick?.(); }}
            className="flex items-center gap-1 text-text-muted text-body-sm hover:text-primary transition-colors"
          >
            <MessageCircle size={16} />
            <span>{feed.comment_count}</span>
          </button>
          <button
            type="button"
            data-testid="bookmark-button"
            onClick={handleBookmarkClick}
            className="ml-auto text-text-muted hover:text-primary transition-colors"
          >
            <Bookmark
              size={16}
              className={cn(isBookmarked && "fill-primary text-primary")}
            />
          </button>
        </div>
      </div>
    </Card>
  );
}

export default FeedCard;
