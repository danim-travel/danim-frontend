"use client";

import { memo } from "react";
import { Heart, MessageCircle, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedCardActionsProps {
  isLiked: boolean;
  likeCountDisplay: number;
  commentCount: number;
  isBookmarked: boolean;
  onLikeClick: (e: React.MouseEvent) => void;
  onCommentClick: (e: React.MouseEvent) => void;
  onBookmarkClick: (e: React.MouseEvent) => void;
  variant?: "panel" | "sheet";
}

function FeedCardActionsBase({
  isLiked,
  likeCountDisplay,
  commentCount,
  isBookmarked,
  onLikeClick,
  onCommentClick,
  onBookmarkClick,
  variant = "panel",
}: FeedCardActionsProps) {
  const isSheet = variant === "sheet";
  const iconSize = isSheet ? 14 : 16;

  return (
    <div className={cn("flex items-center", isSheet ? "gap-3" : "gap-4 pt-1")}>
      <button
        type="button"
        data-testid="like-button"
        onClick={onLikeClick}
        className="flex items-center gap-1 text-text-muted text-body-sm hover:text-error transition-colors"
      >
        <Heart size={iconSize} className={cn(isLiked && "fill-error text-error")} />
        <span data-testid="like-count">{likeCountDisplay}</span>
      </button>
      <button
        type="button"
        onClick={onCommentClick}
        className="flex items-center gap-1 text-text-muted text-body-sm hover:text-primary transition-colors"
      >
        <MessageCircle size={iconSize} />
        <span>{commentCount}</span>
      </button>
      <button
        type="button"
        data-testid="bookmark-button"
        onClick={onBookmarkClick}
        className="ml-auto text-text-muted hover:text-primary transition-colors"
      >
        <Bookmark size={iconSize} className={cn(isBookmarked && "fill-primary text-primary")} />
      </button>
    </div>
  );
}

export const FeedCardActions = memo(FeedCardActionsBase);
