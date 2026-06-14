"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Heart, Pencil, Trash2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import type { Comment } from "@/types";
import { Avatar, Button, Modal } from "@/components/common";
import { KebabMenu } from "./KebabMenu";

interface Props {
  comment: Comment;
  isOwn: boolean;
  onLike: () => void;
  onEdit: (content: string) => void;
  onDelete: () => void;
}

export default function CommentItem({ comment, isOwn, onLike, onEdit, onDelete }: Props) {
  // null = 수정 중 아님, string = 수정 중인 임시 텍스트
  const [editDraft, setEditDraft] = useState<string | null>(null);
  const editing = editDraft !== null;
  const draft = editDraft ?? comment.content ?? "";
  const [zoomedImg, setZoomedImg] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const closeZoom = useCallback(() => setZoomedImg(null), []);

  useEffect(() => {
    if (!zoomedImg) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeZoom();
      }
    };
    // capture: true — window capture phase에서 처리해 document의 PostModal 핸들러에 도달하지 않도록 차단
    window.addEventListener("keydown", handler, { capture: true });
    return () => window.removeEventListener("keydown", handler, { capture: true });
  }, [zoomedImg, closeZoom]);


  const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
    locale: ko,
  });

  // onDelete는 부모 렌더마다 새 참조이므로 ref로 안정화 → menuItems useMemo 효과 보장
  const onDeleteRef = useRef(onDelete);
  useEffect(() => { onDeleteRef.current = onDelete; }, [onDelete]);

  const menuItems = useMemo(() => [
    {
      label: "수정",
      icon: <Pencil size={12} />,
      onClick: () => setEditDraft(comment.content ?? ""),
    },
    {
      label: "삭제",
      icon: <Trash2 size={12} />,
      danger: true as const,
      onClick: () => setConfirmDelete(true),
    },
  ], [comment.content]);

  const handleSaveEdit = () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === comment.content?.trim()) {
      setEditDraft(null);
      return;
    }
    onEdit(trimmed);
    setEditDraft(null);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) handleSaveEdit();
    if (e.key === "Escape") setEditDraft(null);
  };

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
          <div className="mt-1 flex items-center gap-1.5">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setEditDraft(e.target.value)}
              onKeyDown={handleEditKeyDown}
              className="flex-1 text-caption bg-bg-subtle rounded-full border border-border px-3 py-1.5 outline-none text-text-secondary focus:border-primary"
            />
            <Button variant="secondary" size="sm" onClick={() => setEditDraft(null)}>
              취소
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveEdit}>
              저장
            </Button>
          </div>
        ) : (
          comment.content && (
            <p className="mt-0.5 text-body-sm text-text-body leading-5 line-clamp-2 break-words">
              {comment.content}
            </p>
          )
        )}

        {comment.comment_img.img_url && !editing && (
          <div
            className="mt-2 w-20 h-20 rounded-lg overflow-hidden shrink-0 cursor-zoom-in"
            onClick={() => setZoomedImg(comment.comment_img.img_url)}
          >
            <Image
              src={comment.comment_img.img_url}
              alt="댓글 이미지"
              width={80}
              height={80}
              className="object-cover w-full h-full"
            />
          </div>
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
