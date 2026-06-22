"use client";

import Image from "next/image";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Heart, MessageCircle } from "lucide-react";
import { Avatar, Button, Modal } from "@/components/common";
import type { PostDetail, Spot } from "@/types";

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

  return (
    <>
      <article className="bg-bg-card rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-[0_32px_80px_-12px_rgba(0,0,0,0.15)] w-full md:w-[1000px] md:max-w-[96vw]">
        {/* 좌측: 이미지 */}
        <div className="w-full md:w-1/2 bg-bg-subtle relative aspect-square md:aspect-auto md:min-h-[600px]">
          {activeSpot?.images[0] && (
            <Image
              src={activeSpot.images[0].img_url}
              alt={activeSpot.location.place_name}
              fill
              sizes="(min-width: 768px) 500px, 100vw"
              className="object-cover"
              priority
            />
          )}
        </div>

        {/* 우측: 상세 */}
        <div className="flex flex-col flex-1 min-w-0 p-6 gap-4">
          <header className="flex items-center gap-3 min-w-0">
            <Avatar
              src={data.user.profile_img ?? undefined}
              initial={data.user.nickname?.[0] ?? "?"}
              size="md"
            />
            <span className="text-base font-bold text-text truncate">
              {data.user.nickname}
            </span>
          </header>

          {data.post.title && (
            <h1 className="text-heading-sm font-bold text-text">{data.post.title}</h1>
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

          <p className="text-body-sm text-text-body whitespace-pre-wrap">
            {activeSpot?.content ?? data.post.description}
          </p>

          {spots.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {spots.map((s, idx) => (
                <button
                  key={s.spot_id}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  className={`px-3 py-1.5 rounded-full text-body-xs font-medium border transition-colors ${
                    idx === activeIdx
                      ? "bg-primary text-text-inverse border-primary"
                      : "bg-bg-card text-text-muted border-border-subtle hover:bg-bg-subtle"
                  }`}
                  aria-pressed={idx === activeIdx}
                >
                  {idx + 1}. {s.location.place_name}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 pt-3 border-t border-border-subtle mt-auto">
            <button type="button" onClick={requireLogin} aria-label="좋아요" className="flex items-center gap-1.5">
              <Heart className="w-5 h-5 text-text-disabled" />
              <span className="text-body-sm font-medium text-text-muted">{data.like_count}</span>
            </button>
            <button type="button" onClick={requireLogin} aria-label="댓글" className="flex items-center gap-1.5">
              <MessageCircle className="w-5 h-5 text-text-disabled" />
              <span className="text-body-sm font-medium text-text-muted">{data.comment_count}</span>
            </button>
            <button type="button" onClick={requireLogin} aria-label="북마크" className="ml-auto">
              <Bookmark className="w-5 h-5 text-text-disabled" />
            </button>
          </div>

          <Button variant="outline" size="md" onClick={goToLogin}>
            로그인하고 더 보기
          </Button>
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
