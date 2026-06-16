"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/common";
import { usePostModalContext } from "./PostModalContext";
import { useCommentImageAttachment } from "./_hooks/useCommentImageAttachment";
import { uploadCommentImageFile } from "./_lib/uploadCommentImageFile";

export default function CommentInputBar() {
  const [comment, setComment] = useState("");
  const { createComment } = usePostModalContext();
  const {
    imageFile,
    imagePreview,
    fileInputRef,
    handleFileChange,
    handleRemoveImage,
  } = useCommentImageAttachment();
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async () => {
    const trimmed = comment.trim();
    if ((!trimmed && !imageFile) || createComment.isPending || isUploading) return;

    if (imageFile) {
      setIsUploading(true);
      try {
        const commentImg = await uploadCommentImageFile(imageFile);
        createComment.mutate(
          { content: trimmed || null, comment_img: commentImg },
          {
            onSuccess: () => {
              setComment("");
              handleRemoveImage();
            },
          }
        );
      } catch {
        // uploadCommentImageFile 내부에서 toast 처리
      } finally {
        setIsUploading(false);
      }
      return;
    }

    createComment.mutate(
      { content: trimmed || null },
      { onSuccess: () => setComment("") }
    );
  };

  const isPending = createComment.isPending || isUploading;
  const disabled = (!comment.trim() && !imageFile) || isPending;

  return (
    <div className="relative shrink-0">
      {imagePreview && (
        <div className="absolute bottom-full left-0 right-0 bg-bg-card px-6 pt-3 pb-2 border-t border-border-subtle">
          <div className="relative w-16 h-16">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="첨부 이미지" className="w-full h-full object-cover rounded-lg" />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center"
            >
              <X className="w-3 h-3 text-text-inverse" />
            </button>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2.5 px-6 py-3 pb-4 border-t border-border-subtle">
        <div className="flex flex-1 items-center gap-2 bg-bg-subtle rounded-full border border-border px-3 py-2.5 focus-within:border-primary transition-colors">
          <button
            type="button"
            aria-label="이미지 첨부"
            onClick={() => fileInputRef.current?.click()}
            className="text-text-muted hover:text-text-secondary shrink-0"
          >
            <Plus className="w-4 h-4" />
          </button>
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && handleSubmit()}
            className="flex-1 text-caption bg-transparent outline-none text-text-secondary placeholder:text-text-disabled"
            placeholder="댓글을 입력하세요..."
          />
        </div>
        <Button variant="primary" size="sm" onClick={handleSubmit} disabled={disabled} className="rounded-full shrink-0">
          {isPending ? "···" : "전송"}
        </Button>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  );
}
