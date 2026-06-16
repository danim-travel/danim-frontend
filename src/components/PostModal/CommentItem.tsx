"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Heart, Pencil, Plus, Trash2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import type { Comment, CommentImageInput } from "@/types";
import { Avatar, Button, Modal } from "@/components/common";
import { toast } from "@/store/toastStore";
import { KebabMenu } from "./KebabMenu";
import { useCommentImageAttachment } from "./_hooks/useCommentImageAttachment";
import { uploadCommentImageFile } from "./_lib/uploadCommentImageFile";

interface Props {
  comment: Comment;
  isOwn: boolean;
  onLike: () => void;
  onEdit: (content: string | null, commentImg: CommentImageInput | null | undefined) => void;
  onDelete: () => void;
}

export default function CommentItem({ comment, isOwn, onLike, onEdit, onDelete }: Props) {
  const [editDraft, setEditDraft] = useState<string | null>(null);
  const editing = editDraft !== null;
  const draft = editDraft ?? comment.content ?? "";

  const {
    imageFile: editImageFile,
    imagePreview: editImagePreview,
    imageRemovedRef: editImageRemovedRef,
    fileInputRef: editFileInputRef,
    handleFileChange: handleEditFileChange,
    handleRemoveImage: handleRemoveEditImage,
    reset: resetImageAttachment,
  } = useCommentImageAttachment({ trackRemoved: true });
  const [editUploading, setEditUploading] = useState(false);

  const [zoomedImg, setZoomedImg] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const closeZoom = useCallback(() => setZoomedImg(null), []);

  useEffect(() => {
    if (!zoomedImg) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); closeZoom(); }
    };
    window.addEventListener("keydown", handler, { capture: true });
    return () => window.removeEventListener("keydown", handler, { capture: true });
  }, [zoomedImg, closeZoom]);

  const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
    locale: ko,
  });

  const onDeleteRef = useRef(onDelete);
  useEffect(() => { onDeleteRef.current = onDelete; }, [onDelete]);

  const startEditing = useCallback(() => {
    setEditDraft(comment.content ?? "");
    resetImageAttachment(comment.comment_img?.img_url ?? null);
  }, [comment.content, comment.comment_img?.img_url, resetImageAttachment]);

  const cancelEditing = useCallback(() => {
    setEditDraft(null);
    resetImageAttachment(null);
  }, [resetImageAttachment]);

  const menuItems = useMemo(() => [
    {
      label: "수정",
      icon: <Pencil size={12} />,
      onClick: startEditing,
    },
    {
      label: "삭제",
      icon: <Trash2 size={12} />,
      danger: true as const,
      onClick: () => setConfirmDelete(true),
    },
  ], [startEditing]);

  const canSkipSave = (trimmed: string) =>
    trimmed === (comment.content?.trim() ?? "") && !editImageFile && !editImageRemovedRef.current;

  const buildImagePatch = () => {
    if (editImageRemovedRef.current) return { original_img: "", key: "" };
    if (editImageFile) return { original_img: editImageFile.name, key: "" };
    return undefined;
  };

  const hasRemainingCommentMedia = (trimmed: string) =>
    trimmed.length > 0 || !!editImageFile || (!!editImagePreview && !editImageRemovedRef.current);

  const handleSaveEdit = async () => {
    const trimmed = draft.trim();
    if (canSkipSave(trimmed)) {
      cancelEditing();
      return;
    }

    if (!hasRemainingCommentMedia(trimmed)) {
      toast.error("텍스트 또는 이미지 중 하나는 있어야 합니다.");
      return;
    }

    const contentToSend = trimmed || null;
    const nextCommentImage = buildImagePatch();

    if (editImageFile) {
      setEditUploading(true);
      try {
        const commentImg = await uploadCommentImageFile(editImageFile);
        onEdit(contentToSend, commentImg);
        cancelEditing();
      } catch {
        // uploadCommentImageFile 내부에서 toast 처리
      } finally {
        setEditUploading(false);
      }
      return;
    }

    onEdit(contentToSend, nextCommentImage);
    cancelEditing();
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) handleSaveEdit();
    if (e.key === "Escape") { e.stopPropagation(); cancelEditing(); }
  };

  const existingImgUrl = comment.comment_img?.img_url ?? null;

  return (
    <div className="group flex gap-2.5 py-2.5 relative">
      <Avatar
        src={comment.user.profile_img ?? undefined}
        initial={comment.user.nickname?.[0] ?? "?"}
        size="sm"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-body-sm font-semibold text-text">
            {comment.user.nickname}
          </span>
          <span className="text-nav text-text-disabled">{timeAgo}</span>
        </div>

        {editing ? (
          <div className="mt-1 flex flex-col gap-1.5">
            {editImagePreview && (
              <div className="relative w-16 h-16">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={editImagePreview}
                  alt="첨부 이미지"
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleRemoveEditImage}
                  className="absolute -top-1.5 -right-1.5 z-10 w-6 h-6 bg-black/80 rounded-full flex items-center justify-center shadow-md"
                  aria-label="사진 삭제"
                >
                  <X className="w-3 h-3 text-text-inverse" />
                </button>
              </div>
            )}
            {editImagePreview && (
              <button
                type="button"
                onClick={handleRemoveEditImage}
                className="self-start text-caption font-semibold text-text-muted hover:text-text-secondary"
              >
                사진 삭제
              </button>
            )}
            <div className="flex items-center gap-1.5">
              <div className="flex flex-1 items-center gap-2 bg-bg-subtle rounded-full border border-border px-3 py-1.5 focus-within:border-primary transition-colors">
                <button
                  type="button"
                  aria-label="이미지 첨부"
                  onClick={() => editFileInputRef.current?.click()}
                  className="text-text-muted hover:text-text-secondary shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  className="flex-1 text-caption bg-transparent outline-none text-text-secondary"
                />
              </div>
              <Button variant="secondary" size="sm" onClick={cancelEditing} disabled={editUploading}>
                취소
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveEdit} disabled={editUploading}>
                {editUploading ? "···" : "저장"}
              </Button>
            </div>
            <input
              ref={editFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleEditFileChange}
            />
          </div>
        ) : (
          comment.content && (
            <p className="mt-0.5 text-body-sm text-text-body leading-5 line-clamp-2 wrap-break-word">
              {comment.content}
            </p>
          )
        )}

        {existingImgUrl && !editing && (
          <button
            type="button"
            aria-label="이미지 확대"
            className="mt-2 w-20 h-20 rounded-lg overflow-hidden shrink-0 cursor-zoom-in"
            onClick={() => setZoomedImg(existingImgUrl)}
          >
            <Image
              src={existingImgUrl}
              alt="댓글 이미지"
              width={80}
              height={80}
              className="object-cover w-full h-full"
            />
          </button>
        )}

        {zoomedImg && createPortal(
          <div
            className="fixed inset-0 z-9999 flex items-center justify-center bg-black/70"
            onClick={closeZoom}
          >
            <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              <Image
                src={zoomedImg}
                alt="댓글 이미지 확대"
                width={800}
                height={800}
                className="object-contain max-w-[90vw] max-h-[90vh] rounded-xl"
              />
              <button
                onClick={closeZoom}
                aria-label="닫기"
                className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>,
          document.body
        )}

        <Modal
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          title="댓글 삭제"
          className="max-w-sm"
          footer={
            <>
              <Button variant="secondary" size="md" onClick={() => setConfirmDelete(false)}>취소</Button>
              <Button variant="outline" size="md" className="text-error border-error hover:bg-error/5" onClick={() => { setConfirmDelete(false); onDeleteRef.current(); }}>삭제</Button>
            </>
          }
        >
          <p className="text-body-sm text-text-body">댓글을 삭제할까요? 삭제한 댓글은 복구할 수 없습니다.</p>
        </Modal>
      </div>

      {/* 우측: 메뉴 + 좋아요 */}
      <div className="flex flex-col items-end gap-1.5 shrink-0 min-w-[36px]">
        <div className="h-4 flex items-center">
          {isOwn && !editing && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <KebabMenu portal size="sm" items={menuItems} />
            </div>
          )}
        </div>
        <button
          onClick={onLike}
          aria-label={comment.is_liked ? "좋아요 취소" : "좋아요"}
          aria-pressed={comment.is_liked}
          className="flex items-center gap-1 group/like"
        >
          <Heart
            className={`w-3.5 h-3.5 transition-transform group-active/like:scale-125 ${
              comment.is_liked ? "text-error" : "text-text-disabled"
            }`}
            fill={comment.is_liked ? "currentColor" : "none"}
            stroke="currentColor"
          />
          <span className={`text-nav font-medium ${comment.is_liked ? "text-error" : "text-text-muted"}`}>
            {comment.like_count}
          </span>
        </button>
      </div>
    </div>
  );
}
