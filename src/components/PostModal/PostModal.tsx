"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { X, Heart, Bookmark, Link, Share2, Pencil, Trash2, ChevronRight } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import type { PostDetail } from "@/types";
import KebabMenu from "./KebabMenu";
import SpotImages from "./SpotImages";

interface Props {
  postId: string;
  onClose: () => void;
  onGoToMain?: () => void;
  showGoToMain?: boolean;
  className?: string;
}

export default function PostModal({ postId, onClose, onGoToMain, showGoToMain, className }: Props) {
  const [activeSpotIdx, setActiveSpotIdx] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [comment, setComment] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.posts.detail(postId),
    queryFn: () => apiClient.get(`v1/posts/${postId}`).json<PostDetail>(),
  });

  useEffect(() => {
    if (!data) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLiked(data.is_liked);
    setLikeCount(data.like_count);
    setBookmarked(data.is_bookmarked);
  }, [data]);

  const spots = data?.spots ? [...data.spots].sort((a, b) => a.order - b.order) : [];
  const activeSpot = spots[activeSpotIdx];

  const commonMenuItems = [
    { label: "링크 복사", icon: <Link className="w-[15px] h-[15px]" /> },
    { label: "공유하기", icon: <Share2 className="w-[15px] h-[15px]" /> },
  ];

  const ownerMenuItems = [
    { divider: true as const },
    { label: "수정하기", icon: <Pencil className="w-[15px] h-[15px]" /> },
    { label: "삭제하기", danger: true, icon: <Trash2 className="w-[15px] h-[15px]" /> },
  ];

  const menuItems = data?.is_owner
    ? [...commonMenuItems, ...ownerMenuItems]
    : commonMenuItems;

  const handleLike = () => {
    setLiked((v) => !v);
    setLikeCount((c) => c + (liked ? -1 : 1));
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] ${className ?? ""}`}
      onClick={onClose}
    >
      <div
        className="bg-bg-card rounded-3xl overflow-hidden flex shadow-[0_32px_80px_-12px_rgba(0,0,0,0.35)] w-[1000px] max-w-[96vw] max-h-[92vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading && (
          <div className="w-full h-[500px] flex items-center justify-center">
            <span className="text-sm text-text-disabled">불러오는 중...</span>
          </div>
        )}

        {isError && (
          <div className="w-full h-[500px] flex items-center justify-center">
            <span className="text-sm text-text-disabled">게시글을 불러올 수 없습니다.</span>
          </div>
        )}

        {data && (
          <>
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

            {/* Left: image + stepper */}
            <div className="w-1/2 shrink-0 flex flex-col overflow-hidden bg-bg-subtle">
              {activeSpot && <SpotImages key={activeSpot.spot_id} spot={activeSpot} />}

              <div className="px-6 py-5 bg-bg-card border-t border-border-subtle">
                <div className="flex items-start">
                  {spots.map((spot, i) => (
                    <div key={spot.spot_id} className="flex items-start" style={{ flex: i < spots.length - 1 ? 1 : "none" }}>
                      <button onClick={() => setActiveSpotIdx(i)} className="flex flex-col items-center gap-1.5 shrink-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold transition-all border-2 shadow-sm ${
                            i === activeSpotIdx
                              ? "bg-primary border-primary text-text-inverse"
                              : "bg-bg-card border-border text-text-disabled"
                          }`}
                        >
                          {i + 1}
                        </div>
                        <span
                          className={`text-[10px] font-medium leading-tight max-w-[44px] truncate text-center ${
                            i === activeSpotIdx ? "text-primary" : "text-text-disabled"
                          }`}
                        >
                          {spot.location.place_name}
                        </span>
                      </button>
                      {i < spots.length - 1 && (
                        <div
                          className={`flex-1 h-px mt-4 mx-1.5 ${i < activeSpotIdx ? "bg-primary" : "bg-border"}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: detail */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
              <header className="flex items-center gap-3 px-6 pt-5 pb-4 shrink-0">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-bg shrink-0">
                  <Image
                    src={data.user.profile_img}
                    alt={data.user.nickname}
                    width={44}
                    height={44}
                    className="object-cover"
                  />
                </div>
                <span className="text-[14px] font-bold text-text">{data.user.nickname}</span>
              </header>

              {activeSpot && (
                <div className="flex items-center justify-between gap-3 px-6 pt-2 pb-4 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-text-inverse text-[11px] font-bold shrink-0 bg-primary"
                    >
                      {activeSpotIdx + 1}
                    </span>
                    <span className="text-[14px] font-semibold text-text">
                      {activeSpot.location.place_name}
                    </span>
                  </div>
                  {showGoToMain && onGoToMain && (
                    <button
                      onClick={onGoToMain}
                      className="flex items-center gap-1 px-3.5 py-1.5 rounded-full border border-primary text-primary text-[11px] font-semibold shrink-0 hover:opacity-80 transition-all"
                    >
                      코스 상세보기
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-6 pb-2">
                {activeSpot && (
                  <p className="text-[13px] text-text-body leading-[1.75] mb-5 whitespace-pre-line">
                    {activeSpot.content}
                  </p>
                )}
                <div className="border-t border-border-subtle pt-4">
                  <span className="text-[12px] font-semibold text-text-muted uppercase tracking-wide">댓글</span>
                  <span className="ml-2 text-text-emphasis text-[12px] font-semibold">{data.comment_count}개</span>
                  {/* TODO: 댓글 목록 API 연동 후 추가 */}
                </div>
              </div>

              <div className="flex items-center gap-4 px-6 py-3 border-t border-border-subtle shrink-0">
                <button onClick={handleLike} className="flex items-center gap-1.5 group">
                  <Heart
                    className={`w-5 h-5 transition-transform group-active:scale-125 ${liked ? "text-error" : "text-text-disabled"}`}
                    fill={liked ? "currentColor" : "none"}
                    stroke="currentColor"
                  />
                  <span className={`text-[13px] font-medium ${liked ? "text-error" : "text-text-muted"}`}>
                    {likeCount}
                  </span>
                </button>
                <button onClick={() => setBookmarked((v) => !v)} className="group ml-auto">
                  <Bookmark
                    className={`w-5 h-5 transition-transform group-active:scale-110 ${bookmarked ? "text-primary" : "text-text-disabled"}`}
                    fill={bookmarked ? "currentColor" : "none"}
                    stroke="currentColor"
                  />
                </button>
              </div>

              <div className="flex items-center gap-2.5 px-6 py-3 pb-4 border-t border-border-subtle shrink-0">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="flex-1 text-[12px] bg-bg-subtle rounded-full border border-border px-4 py-2.5 outline-none text-text-secondary placeholder:text-text-disabled transition-colors focus:border-primary"
                  placeholder="댓글을 입력하세요..."
                />
                <button
                  className={`shrink-0 px-4 py-2 rounded-full text-[12px] font-semibold transition-all ${
                    comment.trim()
                      ? "bg-primary text-text-inverse"
                      : "bg-bg text-text-disabled"
                  }`}
                  disabled={!comment.trim()}
                >
                  전송
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
