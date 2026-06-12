"use client";

import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/common";
import { uploadImage } from "@/lib/uploadImage";
import { usePostModalContext } from "./PostModalContext";

export default function CommentInputBar() {
  const [comment, setComment] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createComment } = usePostModalContext();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleRemoveImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async () => {
    const trimmed = comment.trim();
    if ((!trimmed && !imageFile) || createComment.isPending || isUploading) return;

    let commentImg: { original_img: string; key: string } | undefined;

    if (imageFile) {
      setIsUploading(true);
      try {
        const { key } = await uploadImage("comments/presigned-url", imageFile);
        commentImg = { original_img: imageFile.name, key };
      } catch {
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    createComment.mutate(
      { content: trimmed || null, comment_img: commentImg },
      {
        onSuccess: () => {
          setComment("");
          handleRemoveImage();
        },
      }
    );
  };

  const isPending = createComment.isPending || isUploading;
  const disabled = (!comment.trim() && !imageFile) || isPending;

  return (
    <div className="relative shrink-0">
      {imagePreview && (
        <div className="absolute bottom-full left-0 right-0 bg-bg-card px-6 pt-3 pb-2 border-t border-border-subtle">
          <div className="relative w-16 h-16">
            <img
              src={imagePreview}
              alt="첨부 이미지"
              className="w-full h-full object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2.5 px-6 py-3 pb-4 border-t border-border-subtle">
        <div className="flex flex-1 items-center gap-2 bg-bg-subtle rounded-full border border-border px-3 py-2.5 focus-within:border-primary transition-colors">
          <button
            type="button"
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
        <Button
          variant="primary"
          size="sm"
          onClick={handleSubmit}
          disabled={disabled}
          className="rounded-full shrink-0"
        >
          {isPending ? "···" : "전송"}
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
