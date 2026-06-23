"use client";

import Image from "next/image";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Heart, Bookmark } from "lucide-react";
import { Avatar, Button, EmptyState, IconButton, Modal, Stepper } from "@/components/common";
import { publicClient } from "@/lib/apiClient";
import { isApiError } from "@/lib/apiError";
import { queryKeys } from "@/lib/queryKeys";
import type { CommentsListResponse, PostDetail, Spot } from "@/types";
import SpotImages from "@/components/PostModal/SpotImages";
import SpotContent from "@/components/PostModal/SpotContent";

interface Props {
  data: PostDetail;
}

export default function GuestPostView({ data }: Props) {
  const router = useRouter();
  const spots: Spot[] = useMemo(
    () => [...data.spots].sort((a, b) => a.order - b.order),
    [data.spots],
  );

  const [activeIdx, setActiveIdx] = useState(0);
  const activeSpot = spots[Math.min(activeIdx, spots.length - 1)] ?? spots[0];
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const requireLogin = () => setAuthModalOpen(true);
  const goToLogin = () => router.push("/login");

  const { data: commentsData, isError: commentsError } = useQuery({
    queryKey: queryKeys.comments.list(data.post.post_id),
    queryFn: () =>
      publicClient
        .get("comments", { searchParams: { post_id: data.post.post_id, page: 1, page_size: 20 } })
        .json<CommentsListResponse>(),
    retry: false,
    staleTime: 30_000,
  });

  const comments = commentsData?.results;
  // 401/403이면 댓글이 인증 필요 → 로그인 유도 표시
  const commentsNeedAuth =
    commentsError && isApiError(commentsError) && (commentsError.status === 401 || commentsError.status === 403);

  const stepperSteps = useMemo(
    () => spots.map((s) => ({ label: s.location.place_name })),
    [spots],
  );

  return (
    <>
      <article className="bg-bg-card rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-[0_32px_80px_-12px_rgba(0,0,0,0.15)] w-full md:w-[1000px] md:max-w-[96vw] md:h-[640px]">
        {/* 좌측: 이미지 + 스테퍼 */}
        <div className="w-full md:w-1/2 flex flex-col overflow-hidden bg-bg-subtle">
          <div className="flex-1 min-h-0 flex flex-col">
            {activeSpot ? (
              <SpotImages key={activeSpot.spot_id} spot={activeSpot} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-text-placeholder text-sm">이미지 없음</span>
              </div>
            )}
          </div>

          <div className="px-5 py-5 md:px-6 md:py-5 bg-bg-card border-t border-border-subtle shrink-0">
            <Stepper
              steps={stepperSteps}
              current={activeIdx}
              onStepClick={setActiveIdx}
              showLabels={false}
            />
          </div>
        </div>

        {/* 우측: 상세 + 댓글 */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* 프로필 헤더 */}
          <header className="flex items-center gap-3 min-w-0 px-6 pt-5 pb-4 shrink-0">
            <button
              type="button"
              onClick={requireLogin}
              className="flex items-center gap-3 min-w-0 rounded-lg -mx-1 px-1 py-0.5 hover:bg-bg-subtle transition-colors"
              aria-label={`${data.user.nickname} 프로필`}
            >
              <Avatar
                src={data.user.profile_img ?? undefined}
                initial={data.user.nickname?.[0] ?? "?"}
                size="md"
              />
              <span className="text-base font-bold text-text truncate">
                {data.user.nickname}
              </span>
            </button>
          </header>

          {/* 제목 + 현재 스팟 */}
          <div className="px-6 pb-4 shrink-0">
            {data.post.title && (
              <h1 className="text-heading-sm font-bold text-text mb-3">{data.post.title}</h1>
            )}

            {activeSpot && (
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-text-inverse text-nav font-bold shrink-0 bg-primary">
                  {activeIdx + 1}
                </span>
                <span className="text-base font-semibold text-text truncate">
                  {activeSpot.location.place_name}
                </span>
              </div>
            )}
          </div>

          {/* 본문 + 댓글 */}
          <div className="flex-1 min-h-0 overflow-hidden px-6 flex flex-col">
            {activeSpot?.content && (
              <SpotContent content={activeSpot.content} />
            )}

            {/* 댓글 섹션 — 남은 공간 차지 후 리스트만 스크롤 */}
            <div className="flex-1 min-h-0 flex flex-col pt-1 border-t border-border-subtle">
              <div className="mb-2 shrink-0">
                <span className="text-caption font-semibold text-text-muted uppercase tracking-wide">댓글</span>
                <span className="ml-2 text-text-emphasis text-caption font-semibold">{data.comment_count}개</span>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none divide-y divide-border-subtle">
                {commentsNeedAuth ? (
                  <p className="text-body-sm text-text-disabled py-2">댓글을 보려면 로그인이 필요합니다.</p>
                ) : !comments ? null : comments.length === 0 ? (
                  <EmptyState title="첫 댓글을 남겨보세요" />
                ) : (
                  comments.map((c) => (
                    <div key={c.comment_id} className="flex gap-2.5 py-2.5">
                      <Avatar
                        src={c.user.profile_img ?? undefined}
                        initial={c.user.nickname?.[0] ?? "?"}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-body-sm font-semibold text-text truncate">{c.user.nickname}</span>
                          <span className="text-nav text-text-disabled shrink-0 whitespace-nowrap">
                            {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ko })}
                          </span>
                        </div>
                        {c.content && (
                          <p className="mt-0.5 text-body-sm text-text-body leading-5 break-words">{c.content}</p>
                        )}
                        {c.comment_img.img_url && (
                          <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden">
                            <Image src={c.comment_img.img_url} alt="댓글 이미지" width={64} height={64} className="object-cover w-full h-full" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 하단 고정: 액션바 + 로그인 유도 버튼 */}
          <div className="shrink-0 border-t border-border-subtle">
            <div className="flex items-center gap-4 px-6 py-3">
              <button type="button" onClick={requireLogin} aria-label="좋아요" className="flex items-center gap-1.5 group">
                <Heart className="w-5 h-5 text-text-disabled" />
                <span className="text-body-sm font-medium text-text-muted">{data.like_count}</span>
              </button>
              <IconButton
                icon={<Bookmark className="w-5 h-5 text-text-disabled" />}
                aria-label="북마크"
                onClick={requireLogin}
                className="ml-auto"
              />
            </div>

            <div className="px-4 pb-4">
              <Button variant="outline" size="md" className="w-full" onClick={goToLogin}>
                로그인하고 더 보기
              </Button>
            </div>
          </div>
        </div>
      </article>

      <Modal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title="로그인이 필요합니다"
        className="max-w-sm"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setAuthModalOpen(false)}>
              취소
            </Button>
            <Button variant="primary" size="md" onClick={goToLogin}>
              로그인하러 가기
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-text-body">이 기능을 사용하려면 로그인이 필요합니다.</p>
      </Modal>
    </>
  );
}
