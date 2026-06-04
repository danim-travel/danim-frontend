"use client";

import { Bookmark, Heart } from "lucide-react";
import type { PostDetail } from "@/types";
import { usePostModalContext } from "./PostModalContext";

interface Props {
  data: Pick<PostDetail, "is_liked" | "like_count" | "is_bookmarked">;
}

export default function ActionBar({ data }: Props) {
  const { postLikeMutation, postBookmarkMutation } = usePostModalContext();

  const handleLike = () => {
    if (postLikeMutation.isPending) return;
    postLikeMutation.mutate({ wasLiked: data.is_liked });
  };

  const handleBookmark = () => {
    if (postBookmarkMutation.isPending) return;
    postBookmarkMutation.mutate(data.is_bookmarked);
  };

  return (
    <div className="flex items-center gap-4 px-6 py-3 border-t border-border-subtle shrink-0">
      <button onClick={handleLike} className="flex items-center gap-1.5 group">
        <Heart
          className={`w-5 h-5 transition-transform group-active:scale-125 ${data.is_liked ? "text-error" : "text-text-disabled"}`}
          fill={data.is_liked ? "currentColor" : "none"}
          stroke="currentColor"
        />
        <span className={`text-body-sm font-medium ${data.is_liked ? "text-error" : "text-text-muted"}`}>
          {data.like_count}
        </span>
      </button>
      <button onClick={handleBookmark} className="group ml-auto">
        <Bookmark
          className={`w-5 h-5 transition-transform group-active:scale-110 ${data.is_bookmarked ? "text-primary" : "text-text-disabled"}`}
          fill={data.is_bookmarked ? "currentColor" : "none"}
          stroke="currentColor"
        />
      </button>
    </div>
  );
}
