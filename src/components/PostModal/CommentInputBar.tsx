"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/common";
import { getApiErrorMessage } from "@/lib/apiError";
import { uploadImage } from "@/lib/uploadImage";
import { toast } from "@/store/toastStore";
import { usePostModalContext } from "./PostModalContext";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

function CommentInputBar() {
  const [comment, setComment] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createComment } = usePostModalContext();

  // imagePreview가 바뀌거나 언마운트될 때 이전 ObjectURL을 해제해 메모리 누수를 방지한다
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("지원하지 않는 파일 형식입니다. (JPEG, PNG, WebP, GIF만 가능)");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    // ObjectURL 해제는 imagePreview를 구독하는 useEffect cleanup이 담당한다
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
      } catch (err) {
        toast.error(getApiErrorMessage(err, { client: "이미지 업로드에 실패했습니다." }));
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
            {/* 사진 위 오버레이 버튼: bg-black/70은 코드베이스 전반의 포토 오버레이 패턴과 동일 */}
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

export default memo(CommentInputBar);
