"use client";

import Image from "next/image";
import { MapPin, Heart, MessageCircle, Bookmark } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, Card } from "@/components/common";
import { cn } from "@/lib/utils";
import { extractRegion } from "@/lib/region";
import { queryKeys } from "@/lib/queryKeys";
import { useLikeMutation } from "@/hooks/useLikeMutation";
import { useBookmarkMutation } from "@/hooks/useBookmarkMutation";
import { updateFeedItem, type FeedCache } from "@/lib/feedCache";
import type { MainFeedItem, PostDetail } from "@/types";

interface FeedCardProps {
  feed: MainFeedItem;
  isFocused: boolean;
  onClick: () => void;
  onCommentClick?: () => void;
}

export function FeedCard({ feed, isFocused, onClick, onCommentClick }: FeedCardProps) {
  const addressName = feed.spots[0]?.location.address_name ?? "";
  const region = addressName ? extractRegion(addressName) : "";
  const queryClient = useQueryClient();
  const feedQueryKey = queryKeys.posts.mainFeed;

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
    // 모달 상세 캐시도 함께 동기화 — 피드에서 좋아요 시 열린 모달에 즉시 반영
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
    // 모달 상세 캐시도 함께 동기화 — 피드에서 북마크 시 열린 모달에 즉시 반영
    onAfterSuccess: (res) => {
      queryClient.setQueryData<PostDetail>(detailKey, (old) => {
        if (!old) return old;
        return { ...old, is_bookmarked: res.is_bookmarked };
      });
    },
  });

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (likeMutation.isPending) return;
    likeMutation.mutate({ wasLiked: feed.is_liked });
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (bookmarkMutation.isPending) return;
    bookmarkMutation.mutate(feed.is_bookmarked);
  };

  return (
    <Card
      variant="elevated"
      padding="none"
      onClick={onClick}
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
            sizes="500px"
            loading="eager"
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
        <p className="text-body-sm text-text-secondary line-clamp-2">{feed.post.description}</p>

        <hr className="border-border" />

        {/* 액션 */}
        <div className="flex items-center gap-4 pt-1">
          <button
            type="button"
            data-testid="like-button"
            onClick={handleLikeClick}
            className="flex items-center gap-1 text-text-muted text-body-sm hover:text-error transition-colors"
          >
            <Heart size={16} className={cn(feed.is_liked && "fill-error text-error")} />
            <span data-testid="like-count">{feed.like_count}</span>
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
              className={cn(feed.is_bookmarked && "fill-primary text-primary")}
            />
          </button>
        </div>
      </div>
    </Card>
  );
}

export default FeedCard;
