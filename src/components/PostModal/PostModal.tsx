"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useScrollLock } from "@/hooks/ui/useScrollLock";
import { X } from "lucide-react";
import { Button, IconButton, Modal } from "@/components/common";
import { toast } from "@/store/toastStore";
import { usePostDelete } from "./_hooks/post/usePostDelete";
import { usePostDetail } from "./_hooks/post/usePostDetail";
import { useCommentsQuery } from "./_hooks/comment/useCommentsQuery";
import { useCommentMutations } from "./_hooks/comment/useCommentMutations";
import { useAuthStore } from "@/store/authStore";
import { config } from "@/lib/config";
import { buildPostContextMenu } from "./menuBuilder";
import { PostModalProvider } from "./PostModalContext";
import { PostModalSkeleton } from "./PostModalSkeleton";
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
  // true = 배경 오버레이 없이 페이지에 인라인으로 표시 (공개 URL 페이지 등)
  inline?: boolean;
  // 진입한 페이지에서 이미 캐시된 썸네일 URL — 데이터 로딩 중 회색 깜빡임 방지용 placeholder
  placeholderThumbnail?: string;
  // 수정 페이지 이동 처리 — 인터셉트 모달은 popstate 기반 처리가 필요해 외부에서 주입
  onEdit?: () => void;
  // 모달 내부에서 다른 페이지로 이동할 때 사용. 인터셉트 모달은 popstate 패턴이 필요해 외부 주입.
  onNavigate?: (href: string) => void;
  // 게시글 삭제 성공 직후 호출 (onClose 이후). 인터셉트 모달이 진입 페이지로 안전하게 이동시킬 때 사용.
  onAfterDelete?: () => void;
}

const urlPathname = (url: string) => { try { return new URL(url).pathname } catch { return url } }

export default function PostModal({ postId, onClose, onGoToMain, showGoToMain, className, initialSpotIdx, inline = false, placeholderThumbnail, onEdit, onNavigate, onAfterDelete }: Props) {
  const router = useRouter();
  const [userSelectedIdx, setUserSelectedIdx] = useState<number | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const { deletePost, isDeleting } = usePostDelete(postId, { onClose, onAfterDelete });

  const { data, isLoading, isError, likeMutation, bookmarkMutation } = usePostDetail(postId);
  const { data: commentsData } = useCommentsQuery(postId);
  const {
    createMutation,
    toggleCommentLike,
    onUpdateComment,
    onDeleteComment,
  } = useCommentMutations(postId);

  const currentUserId = useAuthStore((s) => s.user?.userId) ?? (config.isDev ? SHOWCASE_MOCK_USER_ID : null);

  useScrollLock(!inline);

  useEffect(() => {
    if (isError) {
      toast.error("게시글을 불러올 수 없습니다.");
    }
  }, [isError]);

  useEffect(() => {
    if (inline) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, inline]);

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
        onEdit: onEdit ?? (() => router.push(`/write/${postId}/edit`)),
        onDelete: () => setConfirmDeleteOpen(true),
      }),
    [data?.is_owner, postId, router, onEdit]
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
      onClose,
      navigate: onNavigate ?? ((href: string) => router.push(href)),
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
      onClose,
      onNavigate,
      router,
    ]
  );

  const backdropClass = inline
    ? `relative flex items-center justify-center ${className ?? ""}`
    : `fixed inset-0 z-(--z-page-modal) flex items-center justify-center bg-black/50 backdrop-blur-[2px] ${className ?? ""}`;
  const cardClass = inline
    ? "bg-bg-card rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-[0_32px_80px_-12px_rgba(0,0,0,0.15)] w-full md:w-[1000px] md:max-w-[96vw] md:max-h-[calc(100vh-7rem)] relative"
    : "bg-bg-card rounded-none md:rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-[0_32px_80px_-12px_rgba(0,0,0,0.35)] w-full h-full md:w-[1000px] md:max-w-[96vw] md:h-auto md:max-h-[92vh] relative";

  return (
    <motion.div
      data-testid="post-modal-backdrop"
      className={backdropClass}
      onClick={inline ? undefined : onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        data-testid="post-modal"
        className={cardClass}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2 }}
      >
        {!data && isLoading && <PostModalSkeleton placeholderThumbnail={placeholderThumbnail} />}

        {isError && !data && (
          <div className="w-full h-[600px] flex flex-col items-center justify-center gap-3 text-text-muted">
            <p className="text-body-sm">게시글을 불러올 수 없습니다.</p>
            <button
              type="button"
              onClick={onClose}
              className="text-primary text-body-sm underline underline-offset-2"
            >
              닫기
            </button>
          </div>
        )}

        {/* 항상 표시되는 닫기 버튼 — inline 모드에서는 X 숨김(독립 페이지) */}
        <div className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 z-20 flex items-center gap-2">
          {data && <KebabMenu items={menuItems} />}
          {!inline && (
            <IconButton
              icon={<X size={14} />}
              variant="filled"
              size="sm"
              aria-label="닫기"
              onClick={onClose}
              className="bg-white/90 backdrop-blur-sm border border-border hover:bg-bg-card"
            />
          )}
        </div>

        {data && (
          <PostModalProvider value={contextValue}>
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

      <Modal
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="게시글 삭제"
        className="max-w-sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setConfirmDeleteOpen(false)}
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button
              variant="outline"
              size="md"
              className="text-error border-error hover:bg-error/5"
              onClick={() => deletePost()}
              loading={isDeleting}
              disabled={isDeleting}
            >
              삭제
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-text-body">
          이 게시글을 정말 삭제하시겠습니까? 삭제하면 복구할 수 없습니다.
        </p>
      </Modal>
    </motion.div>
  );
}
