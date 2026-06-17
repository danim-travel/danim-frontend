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
            sizes="(max-width: 768px) 50vw, 250px"
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
        <p className="text-body-sm text-text-secondary line-clamp-2 flex-1">{feed.post.description}</p>

        {/* 액션 */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="like-button"
            onClick={handleLikeClick}
            className="flex items-center gap-1 text-text-muted text-body-sm hover:text-error transition-colors"
          >
            <Heart size={14} className={cn(feed.is_liked && "fill-error text-error")} />
            <span data-testid="like-count">{feed.like_count}</span>
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
              className={cn(feed.is_bookmarked && "fill-primary text-primary")}
            />
          </button>
        </div>
      </div>
    </Card>
  );
}

export default FeedCard;
