"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Heart, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import type { Comment } from "@/types";
import { COMMENT_MENU_HEIGHT_PX } from "./constants";

function calcMenuPos(rect: DOMRect) {
  const isBottomOverflow = rect.bottom + 4 + COMMENT_MENU_HEIGHT_PX > window.innerHeight;
  return {
    top: Math.max(0, isBottomOverflow ? rect.top - COMMENT_MENU_HEIGHT_PX - 4 : rect.bottom + 4),
    right: Math.max(0, window.innerWidth - rect.right),
  };
}

interface Props {
  comment: Comment;
  isOwn: boolean;
  onLike: () => void;
  onEdit: (content: string) => void;
  onDelete: () => void;
}

export default function CommentItem({ comment, isOwn, onLike, onEdit, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false); // 케밥 메뉴 열림/닫힘
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);  // 메뉴 뜨는 위치 (top, right 좌표)
  const [editing, setEditing] = useState(false);  // 수정 모드인지 여부
  const [draft, setDraft] = useState(comment.content ?? "");  // 수정 중인 텍스트 (초기값: 현재 댓글 내용)
  const buttonRef = useRef<HTMLButtonElement>(null); // 케밥 버튼 DOM 참조 (메뉴 위치 계산용)
  const menuRef = useRef<HTMLDivElement>(null); // 메뉴 DOM 참조 (바깥 클릭 감지용)

  // 수정 중이 아닐 때 서버에서 내용이 바뀌면 draft 동기화
  useEffect(() => {
    if (!editing) setDraft(comment.content ?? "");
  }, [comment.content, editing]);

  const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
    locale: ko,
  });

  // 메뉴 위치 계산 + 바깥 클릭 감지
  useEffect(() => {
    if (!menuOpen || !buttonRef.current) return;
    setMenuPos(calcMenuPos(buttonRef.current.getBoundingClientRect()));
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current && !menuRef.current.contains(target) &&
        buttonRef.current && !buttonRef.current.contains(target)
      ) {
        setMenuOpen(false);
      }
    };

    // 메뉴는 portal 고정 좌표라 외부 스크롤·리사이즈 시 트리거와 분리됨 → 그냥 닫음
    const closeMenu = () => setMenuOpen(false);
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", closeMenu, true);
    window.addEventListener("resize", closeMenu);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("resize", closeMenu);
    };
  }, [menuOpen]);

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
      <div className="w-8 h-8 rounded-full overflow-hidden bg-bg-subtle shrink-0">
        {comment.user.profile_img && (
          <Image
            src={comment.user.profile_img}
            alt={comment.user.nickname}
            width={32}
            height={32}
            className="object-cover w-full h-full"
          />
        )}
      </div>

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
            <button
              onClick={handleSaveEdit}
              className="shrink-0 px-2.5 py-1 rounded-full bg-primary text-text-inverse text-caption font-semibold"
            >
              저장
            </button>
            <button
              onClick={() => setEditing(false)}
              className="shrink-0 px-2.5 py-1 rounded-full bg-bg text-text-disabled text-caption font-semibold"
            >
              취소
            </button>
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
            <button
              ref={buttonRef}
              onClick={() => setMenuOpen((v) => !v)}
              className="text-text-disabled hover:text-text-body opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="더보기"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
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

      {/* 메뉴 드롭다운 - Portal로 body에 직접 띄워서 스크롤 컨테이너 영향 받지 않게 함 */}
      {menuOpen && menuPos && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", top: menuPos.top, right: menuPos.right }}
            className="min-w-[110px] bg-bg-card border border-border-subtle rounded-xl shadow-md py-1 z-[60] overflow-hidden"
          >
            <button
              onClick={() => {
                setMenuOpen(false);
                setDraft(comment.content ?? "");
                setEditing(true);
              }}
              className="flex items-center gap-2 w-full h-8 px-3 text-caption font-medium text-text-secondary hover:bg-bg-subtle"
            >
              <Pencil className="w-3 h-3 text-text-disabled" />
              수정하기
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onDelete();
              }}
              className="flex items-center gap-2 w-full h-8 px-3 text-caption font-medium text-error hover:bg-error-bg"
            >
              <Trash2 className="w-3 h-3" />
              삭제하기
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
