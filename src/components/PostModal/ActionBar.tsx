"use client";

import { Bookmark, Heart } from "lucide-react";
import { useDebouncedToggle } from "@/hooks/useDebouncedToggle";
import type { PostDetail } from "@/types";
import { usePostModalContext } from "./PostModalContext";

interface Props {
  data: Pick<PostDetail, "is_liked" | "like_count" | "is_bookmarked">;
}

export default function ActionBar({ data }: Props) {
  const { postLikeMutation, postBookmarkMutation } = usePostModalContext();

  // 좋아요: localState로 즉시 토글, 400ms 후 net-zero 검사 후 mutate
  const { localState: isLiked, toggle: toggleLike, countDelta: likeDelta } = useDebouncedToggle({
    serverState: data.is_liked,
    onCommit: (wasLiked) => postLikeMutation.mutate({ wasLiked }),
  });

  const { localState: isBookmarked, toggle: toggleBookmark } = useDebouncedToggle({
    serverState: data.is_bookmarked,
    onCommit: (wasBookmarked) => postBookmarkMutation.mutate(wasBookmarked),
  });

  const likeCountDisplay = data.like_count + likeDelta;

  return (
    <div className="flex items-center gap-4 px-6 py-3 border-t border-border-subtle shrink-0">
      <button
        type="button"
        onClick={toggleLike}
        data-testid="modal-like-button"
        aria-label={isLiked ? "좋아요 취소" : "좋아요"}
        aria-pressed={isLiked}
        className="flex items-center gap-1.5 group"
      >
        <Heart
          className={`w-5 h-5 transition-transform group-active:scale-125 ${isLiked ? "text-error" : "text-text-disabled"}`}
          fill={isLiked ? "currentColor" : "none"}
          stroke="currentColor"
        />
        <span data-testid="modal-like-count" className={`text-body-sm font-medium ${isLiked ? "text-error" : "text-text-muted"}`}>
          {likeCountDisplay}
        </span>
      </button>
      <button
        type="button"
        onClick={toggleBookmark}
        data-testid="modal-bookmark-button"
        aria-label={isBookmarked ? "북마크 해제" : "북마크"}
        aria-pressed={isBookmarked}
        className="group ml-auto"
      >
        <Bookmark
          className={`w-5 h-5 transition-transform group-active:scale-110 ${isBookmarked ? "text-primary" : "text-text-disabled"}`}
          fill={isBookmarked ? "currentColor" : "none"}
          stroke="currentColor"
        />
      </button>
    </div>
  );
}
