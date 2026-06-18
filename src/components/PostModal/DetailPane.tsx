"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Comment, PostDetail, Spot } from "@/types";
import { Avatar, Button } from "@/components/common";
import ActionBar from "./ActionBar";
import CommentInputBar from "./CommentInputBar";
import CommentSection from "./CommentSection";
import SpotContent from "./SpotContent";
import { usePostModalContext } from "./PostModalContext";

interface Props {
  data: PostDetail;
  activeSpot: Spot | undefined;
  activeSpotIdx: number;
  comments: Comment[] | undefined;
  showGoToMain?: boolean;
  onGoToMain?: () => void;
}

export default function PostModalDetailPane({
  data,
  activeSpot,
  activeSpotIdx,
  comments,
  showGoToMain,
  onGoToMain,
}: Props) {
  const { currentUserId, onClose } = usePostModalContext();
  const isOwn = !!currentUserId && currentUserId === data.user.user_id;
  const profileHref = isOwn ? "/mypage" : `/users/${data.user.user_id}`;

  return (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
      <header className="flex items-center px-6 pt-5 pb-4 shrink-0">
        <Link
          href={profileHref}
          onClick={onClose}
          className="flex items-center gap-3 min-w-0 rounded-lg -mx-1 px-1 py-0.5 hover:bg-bg-subtle transition-colors"
          aria-label={`${data.user.nickname} 프로필로 이동`}
        >
          <Avatar
            src={data.user.profile_img ?? undefined}
            initial={data.user.nickname?.[0] ?? "?"}
            size="md"
          />
          <span className="text-base font-bold text-text truncate">{data.user.nickname}</span>
        </Link>
      </header>

      {activeSpot && (
        <div className="flex items-center justify-between gap-3 px-6 pt-2 pb-4 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-text-inverse text-nav font-bold shrink-0 bg-primary">
              {activeSpotIdx + 1}
            </span>
            <span className="text-base font-semibold text-text truncate">
              {activeSpot.location.place_name}
            </span>
          </div>
          {showGoToMain && onGoToMain && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGoToMain}
              rightIcon={<ChevronRight size={12} />}
            >
              코스 상세보기
            </Button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 flex flex-col">
        <SpotContent content={activeSpot?.content ?? ''} />
        <CommentSection comments={comments} commentCount={data.comment_count} />
      </div>

      <ActionBar data={data} />
      <CommentInputBar />
    </div>
  );
}
