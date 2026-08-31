"use client";

import { useEffect, useRef, useState } from "react";
import { ALLOWED_COMMENT_IMAGE_TYPES } from "../_constants/commentImage";
import { getImageFileError } from "@/lib/media/imageConstraints";
import { toast } from "@/store/toastStore";

interface UseCommentImageAttachmentOptions {
  /**
   * 이미지 제거 여부를 별도 상태로 추적할지 여부.
   * 댓글 수정(CommentItem)에서는 true, 새 댓글 작성(CommentInputBar)에서는 false.
   * @default false
   */
  trackRemoved?: boolean;
  /** 수정 모드 진입 시 기존 이미지 URL을 초기값으로 설정할 때 사용한다. */
  initialPreviewUrl?: string | null;
}

interface UseCommentImageAttachmentResult {
  imageFile: File | null;
  imagePreview: string | null;
  /** trackRemoved=true 일 때만 의미 있음. 이미지 제거 여부. */
  imageRemoved: boolean;
  imageRemovedRef: React.MutableRefObject<boolean>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveImage: () => void;
  /** 상태를 초기값으로 되돌린다. 수정 취소 시 호출한다. */
  reset: (initialPreview?: string | null) => void;
}

export function useCommentImageAttachment(
  options: UseCommentImageAttachmentOptions = {}
): UseCommentImageAttachmentResult {
  const { trackRemoved = false, initialPreviewUrl = null } = options;

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialPreviewUrl);
  const [imageRemoved, setImageRemoved] = useState(false);
  const imageRemovedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!imageFile || !imagePreview) return;
    const url = imagePreview;
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile, imagePreview]);

  const reset = (initialPreview: string | null = null) => {
    setImageFile(null);
    setImagePreview(initialPreview);
    setImageRemoved(false);
    imageRemovedRef.current = false;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const error = getImageFileError(file, ALLOWED_COMMENT_IMAGE_TYPES);
    if (error) {
      toast.error(error);
      return;
    }
    if (imageFile && imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    if (trackRemoved) {
      setImageRemoved(false);
      imageRemovedRef.current = false;
    }
  };

  const handleRemoveImage = () => {
    if (imageFile && imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    if (trackRemoved) {
      setImageRemoved(true);
      imageRemovedRef.current = true;
    }
  };

  return {
    imageFile,
    imagePreview,
    imageRemoved,
    imageRemovedRef,
    fileInputRef,
    handleFileChange,
    handleRemoveImage,
    reset,
  };
}
