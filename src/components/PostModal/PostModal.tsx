"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { usePostDetail } from "@/hooks/usePostDetail";
import { useCommentsQuery } from "@/hooks/useCommentsQuery";
import { useCommentMutations } from "@/hooks/useCommentMutations";
import { useAuthStore } from "@/store/authStore";
import { buildPostContextMenu } from "./menuBuilder";
import { PostModalProvider } from "./PostModalContext";
import KebabMenu from "./KebabMenu";
import ImagePane from "./ImagePane";
import DetailPane from "./DetailPane";

interface Props {
  postId: string;
  onClose: () => void;
  onGoToMain?: () => void;
  showGoToMain?: boolean;
  className?: string;
}

export default function PostModal({ postId, onClose, onGoToMain, showGoToMain, className }: Props) {
  const [activeSpotIdx, setActiveSpotIdx] = useState(0);

  const { data, isLoading, isError, likeMutation, bookmarkMutation } = usePostDetail(postId);
  const { data: commentsData } = useCommentsQuery(postId);
  const {
    createMutation,
    toggleCommentLike,
    onUpdateComment,
    onDeleteComment,
  } = useCommentMutations(postId);

  const currentUserId = useAuthStore((s) => s.user?.userId) ?? null;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const spots = useMemo(
    () => (data?.spots ? [...data.spots].sort((a, b) => a.order - b.order) : []),
    [data?.spots]
  );

  // activeSpotIdx가 범위를 벗어나면(예: 데이터 재조회로 스팟 수 감소 시) 첫 번째로 복원
  const activeSpot = spots[activeSpotIdx] ?? spots[0];

  const menuItems = useMemo(
    () =>
      buildPostContextMenu({
        isOwner: data?.is_owner ?? false,
        // TODO: 수정/삭제 라우팅·확인 모달 — 후속 PR
        onEdit: () => {},
        onDelete: () => {},
      }),
    [data?.is_owner]
  );

  // activeSpotIdx 변경 시 Context consumers가 불필요하게 리렌더되지 않도록 메모이즈.
  // mutation 실행 중엔 mutation 객체 참조가 바뀌므로 context는 재생성된다.
  const contextValue = useMemo(
    () => ({
      postId,
      currentUserId,
      postLikeMutation: likeMutation,
      postBookmarkMutation: bookmarkMutation,
      createComment: createMutation,
      onUpdateComment,
      onDeleteComment,
      toggleCommentLike,
    }),
    [
      postId,
      currentUserId,
      likeMutation,
      bookmarkMutation,
      createMutation,
      onUpdateComment,
      onDeleteComment,
      toggleCommentLike,
    ]
  );

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] ${className ?? ""}`}
      onClick={onClose}
    >
      <div
        className="bg-bg-card rounded-3xl overflow-hidden flex shadow-[0_32px_80px_-12px_rgba(0,0,0,0.35)] w-[1000px] max-w-[96vw] max-h-[92vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {!data && isLoading && (
          <div className="w-full h-[500px] flex items-center justify-center">
            <span className="text-sm text-text-disabled">불러오는 중...</span>
          </div>
        )}

        {!data && isError && (
          <div className="w-full h-[500px] flex items-center justify-center">
            <span className="text-sm text-text-disabled">게시글을 불러올 수 없습니다.</span>
          </div>
        )}

        {data && (
          <PostModalProvider value={contextValue}>
            {/* Floating controls */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              <KebabMenu items={menuItems} />
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-border flex items-center justify-center text-text-disabled hover:bg-bg-card hover:text-text-body transition-all"
                aria-label="닫기"
              >
                <X className="w-[14px] h-[14px]" />
              </button>
            </div>

            <ImagePane
              spots={spots}
              activeSpotIdx={activeSpotIdx}
              activeSpot={activeSpot}
              onSelectSpot={setActiveSpotIdx}
            />
            <DetailPane
              data={data}
              activeSpot={activeSpot}
              activeSpotIdx={activeSpotIdx}
              comments={commentsData?.results}
              showGoToMain={showGoToMain}
              onGoToMain={onGoToMain}
            />
          </PostModalProvider>
        )}
      </div>
    </div>
  );
}
