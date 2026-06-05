"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { Heart, Pencil, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import type { Comment } from "@/types";
import { Avatar, Button } from "@/components/common";
import { KebabMenu } from "./KebabMenu";

interface Props {
  comment: Comment;
  isOwn: boolean;
  onLike: () => void;
  onEdit: (content: string) => void;
  onDelete: () => void;
}

export default function CommentItem({ comment, isOwn, onLike, onEdit, onDelete }: Props) {
  const [editing, setEditing] = useState(false);  // 수정 모드인지 여부
  const [draft, setDraft] = useState(comment.content ?? "");  // 수정 중인 텍스트 (초기값: 현재 댓글 내용)

  // 수정 중이 아닐 때 서버에서 내용이 바뀌면 draft 동기화
  useEffect(() => {
    if (!editing) setDraft(comment.content ?? "");
  }, [comment.content, editing]);

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
      onClick: () => {
        setDraft(comment.content ?? "");
        setEditing(true);
      },
    },
    {
      label: "삭제",
      icon: <Trash2 size={12} />,
      danger: true as const,
      onClick: () => onDeleteRef.current(),
    },
  ], [comment.content]);

  const handleSaveEdit = () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === comment.content?.trim()) {
      setEditing(false);
      return;
    }
    onEdit(trimmed);
    setEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) handleSaveEdit();
    if (e.key === "Escape") setEditing(false);
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
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleEditKeyDown}
              className="flex-1 text-caption bg-bg-subtle rounded-full border border-border px-3 py-1.5 outline-none text-text-secondary focus:border-primary"
            />
            <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>
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
          <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden shrink-0">
            <Image
              src={comment.comment_img.img_url}
              alt="댓글 이미지"
              width={80}
              height={80}
              className="object-cover w-full h-full"
            />
          </div>
        )}
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
