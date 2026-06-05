"use client";

import { useState } from "react";
import { Button } from "@/components/common";
import { usePostModalContext } from "./PostModalContext";

export default function CommentInputBar() {
  const [comment, setComment] = useState("");
  const { createComment } = usePostModalContext();

  const handleSubmit = () => {
    const trimmed = comment.trim();
    if (!trimmed || createComment.isPending) return;
    createComment.mutate({ content: trimmed }, { onSuccess: () => setComment("") });
  };

  const disabled = !comment.trim() || createComment.isPending;

  return (
    <div className="flex items-center gap-2.5 px-6 py-3 pb-4 border-t border-border-subtle shrink-0">
      <input
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && handleSubmit()}
        className="flex-1 text-caption bg-bg-subtle rounded-full border border-border px-4 py-2.5 outline-none text-text-secondary placeholder:text-text-disabled transition-colors focus:border-primary"
        placeholder="댓글을 입력하세요..."
      />
      <Button
        variant="primary"
        size="sm"
        onClick={handleSubmit}
        disabled={disabled}
        className="rounded-full shrink-0"
      >
        전송
      </Button>
    </div>
  );
}
