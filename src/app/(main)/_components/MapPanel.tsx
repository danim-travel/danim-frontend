"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import type { MainFeedItem, Post } from "@/types";
import { usePinColor } from "../_hooks/usePinColor";

const KakaoMap = dynamic(() => import("@/components/KakaoMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-bg-subtle animate-pulse" />,
});

interface MapPanelProps {
  focusedPost: MainFeedItem | null;
  focusedPostIndex: number;
  onPinClick: (postId: string, spotIdx: number) => void;
  /** 현재위치 이동 시 포커스 초기화 (핀/폴리라인 제거) */
  onResetFocus?: () => void;
}

export function MapPanel({ focusedPost, focusedPostIndex, onPinClick, onResetFocus }: MapPanelProps) {
  const pinColor = usePinColor(focusedPostIndex);

  const mapPost = useMemo<Post | null>(() => {
    if (!focusedPost) return null;
    return {
      post_id: focusedPost.post.post_id,
      color: pinColor,
      pins: focusedPost.spots.map((s) => ({
        lat: Number(s.location.y),
        lng: Number(s.location.x),
        label: s.location.place_name,
        body: s.location.address_name,
      })),
    };
  }, [focusedPost, pinColor]);

  return (
    <section className="relative flex-1 min-w-0 h-full rounded-2xl overflow-hidden shadow-sm">
      <KakaoMap
        selectedPost={mapPost}
        onPinClick={(post, pinIndex) => onPinClick(post.post_id, pinIndex)}
        onCurrentLocation={onResetFocus}
      />

      {/* 좌상단 지도 라벨 */}
      <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-pill bg-bg-card shadow-md text-body-sm font-semibold text-text-primary">
        지도
      </div>
    </section>
  );
}

export default MapPanel;
