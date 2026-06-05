"use client";

import Image from "next/image";
import { MapPin, Heart, MessageCircle, Bookmark } from "lucide-react";
import { Avatar, Card } from "@/components/common";
import { cn } from "@/lib/utils";
import { extractRegion } from "@/lib/region";
import type { FeedPost } from "@/types";

interface FeedCardProps {
  feed: FeedPost;
  isFocused: boolean;
  onClick: () => void;
}

export function FeedCard({ feed, isFocused, onClick }: FeedCardProps) {
  const region = extractRegion(feed.post.address_name);

  return (
    <Card
      variant="elevated"
      padding="none"
      onClick={onClick}
      className={cn(
        "overflow-hidden border-2 transition-colors",
        isFocused ? "border-primary" : "border-transparent hover:border-primary/70"
      )}
    >
      {/* 썸네일 */}
      <div className="relative w-full aspect-[16/9] bg-bg-subtle">
        {feed.post.thumbnail && (
          <Image
            src={feed.post.thumbnail}
            alt={feed.post.title}
            fill
            className="object-cover"
            sizes="500px"
          />
        )}
        {feed.post.spot_count > 0 && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-pill bg-white text-text-primary text-label font-semibold shadow-sm shrink-0">
            <MapPin size={12} className="text-primary" />
            <span>{feed.post.spot_count}</span>
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
            <span className="text-body-sm text-text-muted">{region}</span>
          </div>
        </div>

        {/* 제목 */}
        <h3 className="font-bold text-card-title leading-snug truncate">{feed.post.title}</h3>

        {/* 본문 2줄 clamp */}
        <p className="text-body-sm text-text-secondary line-clamp-2">{feed.post.content}</p>

        {/* 액션 */}
        <div className="flex items-center gap-4 pt-1">
          <span className="flex items-center gap-1 text-text-muted text-body-sm">
            <Heart size={16} className={cn(feed.is_liked && "fill-error text-error")} />
            <span>{feed.like_count}</span>
          </span>
          <span className="flex items-center gap-1 text-text-muted text-body-sm">
            <MessageCircle size={16} />
            <span>{feed.comment_count}</span>
          </span>
          <span className="ml-auto text-text-muted">
            <Bookmark
              size={16}
              className={cn(feed.is_bookmarked && "fill-primary text-primary")}
            />
          </span>
        </div>
      </div>
    </Card>
  );
}

export default FeedCard;
