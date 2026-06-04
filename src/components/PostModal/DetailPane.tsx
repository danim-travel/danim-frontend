"use client";

import Image from "next/image";
import { ChevronRight } from "lucide-react";
import type { Comment, PostDetail, Spot } from "@/types";
import ActionBar from "./ActionBar";
import CommentInputBar from "./CommentInputBar";
import CommentSection from "./CommentSection";
import SpotContent from "./SpotContent";

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
  return (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
      <header className="flex items-center gap-3 px-6 pt-5 pb-4 shrink-0">
        <div className="w-11 h-11 rounded-full overflow-hidden bg-bg shrink-0">
          {data.user.profile_img && (
            <Image
              src={data.user.profile_img}
              alt={data.user.nickname}
              width={44}
              height={44}
              className="object-cover"
            />
          )}
        </div>
        <span className="text-base font-bold text-text">{data.user.nickname}</span>
      </header>

      {activeSpot && (
        <div className="flex items-center justify-between gap-3 px-6 pt-2 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-text-inverse text-nav font-bold shrink-0 bg-primary">
              {activeSpotIdx + 1}
            </span>
            <span className="text-base font-semibold text-text">
              {activeSpot.location.place_name}
            </span>
          </div>
          {showGoToMain && onGoToMain && (
            <button
              onClick={onGoToMain}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-full border border-primary text-primary text-nav font-semibold shrink-0 hover:opacity-80 transition-all"
            >
              코스 상세보기
              <ChevronRight className="w-3 h-3" />
            </button>
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
