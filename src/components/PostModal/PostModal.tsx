"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useScrollLock } from "@/hooks/useScrollLock";
import { X } from "lucide-react";
import { IconButton, UserRowSkeleton } from "@/components/common";
import { toast } from "@/store/toastStore";
import { usePostDetail } from "@/hooks/usePostDetail";
import { useCommentsQuery } from "@/hooks/useCommentsQuery";
import { useCommentMutations } from "@/hooks/useCommentMutations";
import { useAuthStore } from "@/store/authStore";
import { config } from "@/lib/config";
import { buildPostContextMenu } from "./menuBuilder";
import { PostModalProvider } from "./PostModalContext";
import { SHOWCASE_MOCK_USER_ID } from "./constants";
import KebabMenu from "./KebabMenu";
import ImagePane from "./ImagePane";
import DetailPane from "./DetailPane";

interface Props {
  postId: string;
  onClose: () => void;
  onGoToMain?: () => void;
  showGoToMain?: boolean;
  className?: string;
  // undefined = 데이터 로드 후 썸네일이 있는 spot으로 자동 이동 (댓글 클릭)
  // number  = 해당 spot 바로 오픈 (마커 클릭)
  initialSpotIdx?: number;
}

const urlPathname = (url: string) => { try { return new URL(url).pathname } catch { return url } }

export default function PostModal({ postId, onClose, onGoToMain, showGoToMain, className, initialSpotIdx }: Props) {
  const [userSelectedIdx, setUserSelectedIdx] = useState<number | null>(null);

  const { data, isLoading, isError, likeMutation, bookmarkMutation } = usePostDetail(postId);
  const { data: commentsData } = useCommentsQuery(postId);
  const {
    createMutation,
    toggleCommentLike,
    onUpdateComment,
    onDeleteComment,
  } = useCommentMutations(postId);

  const currentUserId = useAuthStore((s) => s.user?.userId) ?? (config.isDev ? SHOWCASE_MOCK_USER_ID : null);

  useScrollLock(true);

  useEffect(() => {
    if (isError) {
      toast.error("게시글을 불러올 수 없습니다.");
      onClose();
    }
  }, [isError, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const spots = useMemo(
    () => (data?.spots ? [...data.spots].sort((a, b) => a.order - b.order) : []),
    [data]
  );

  // initialSpotIdx 없으면(댓글 클릭) thumbnail URL pathname으로 spot 탐색 — presigned URL 대응
  const thumbnailSpotIdx = useMemo(() => {
    if (initialSpotIdx !== undefined || !data) return undefined;
    const thumbnailPath = urlPathname(data.post.thumbnail);
    const idx = spots.findIndex((spot) =>
      spot.images.some((img) => urlPathname(img.img_url) === thumbnailPath)
    );
    return idx !== -1 ? idx : 0;
  }, [data, initialSpotIdx, spots]);

  const activeSpotIdx = userSelectedIdx ?? thumbnailSpotIdx ?? initialSpotIdx ?? 0;

  // activeSpotIdx가 범위를 벗어나면(예: 데이터 재조회로 스팟 수 감소 시) 첫 번째로 복원
  const activeSpot = spots[activeSpotIdx] ?? spots[0];

  const menuItems = useMemo(
    () =>
      buildPostContextMenu({
        isOwner: data?.is_owner ?? false,
        postId,
        // TODO: 수정/삭제 라우팅·확인 모달 — 후속 PR
        onEdit: () => {},
        onDelete: () => {},
      }),
    [data?.is_owner, postId]
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
    <AnimatePresence>
    <motion.div
      data-testid="post-modal-backdrop"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] ${className ?? ""}`}
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        data-testid="post-modal"
        className="bg-bg-card rounded-3xl overflow-hidden flex shadow-[0_32px_80px_-12px_rgba(0,0,0,0.35)] w-[1000px] max-w-[96vw] max-h-[92vh] relative"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2 }}
      >
        {!data && isLoading && (
          <div className="w-full h-[500px] flex items-center justify-center">
            <UserRowSkeleton rows={3} />
          </div>
        )}

        {data && (
          <PostModalProvider value={contextValue}>
            {/* Floating controls */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              <KebabMenu items={menuItems} />
              <IconButton
                icon={<X size={14} />}
                variant="filled"
                size="sm"
                aria-label="닫기"
                onClick={onClose}
                className="bg-white/90 backdrop-blur-sm border border-border hover:bg-bg-card"
              />
            </div>

            <ImagePane
              spots={spots}
              activeSpotIdx={activeSpotIdx}
              activeSpot={activeSpot}
              onSelectSpot={setUserSelectedIdx}
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
      </motion.div>
    </motion.div>
    </AnimatePresence>
  );
}
