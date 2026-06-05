"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Plus, Minus } from "lucide-react";
import type { FeedPost } from "@/types";
import type { MapControls } from "@/components/KakaoMap";
import { type Region } from "@/lib/region";
import { toMapPost } from "@/lib/feedMapper";
import { usePinColor } from "../_hooks/usePinColor";
import RegionFilter from "./RegionFilter";

const KakaoMap = dynamic(() => import("@/components/KakaoMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-bg-subtle animate-pulse" />,
});

interface MapPanelProps {
  focusedPost: FeedPost | null;
  onPinClick: (postId: string) => void;
  /** 현재위치 이동 시 포커스 초기화 (핀/폴리라인 제거) */
  onResetFocus?: () => void;
}

export function MapPanel({ focusedPost, onPinClick, onResetFocus }: MapPanelProps) {
  // TODO: API 연동 브랜치에서 selectedRegion을 쿼리 파라미터로 연결
  const [selectedRegion, setSelectedRegion] = useState<Region>("전체");
  const mapControlsRef = useRef<MapControls | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const pinColor = usePinColor();

  const mapPost = useMemo(() => {
    if (!focusedPost || !pinColor) return null;
    return toMapPost(focusedPost, pinColor);
  }, [focusedPost, pinColor]);

  return (
    <section className="relative flex-1 min-w-0 h-full rounded-2xl overflow-hidden shadow-sm">
      <KakaoMap
        selectedPost={mapPost}
        onMapReady={(controls) => {
          mapControlsRef.current = controls;
          setMapReady(true);
        }}
        onPinClick={(post) => onPinClick(post.post_id)}
        onCurrentLocation={onResetFocus}
      />

      {/* 좌상단 지도 라벨 */}
      <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-pill bg-bg-card shadow-md text-body-sm font-semibold text-text-primary">
        지도
      </div>

      {/* 우측 줌 컨트롤 */}
      <div className="absolute top-1/2 right-4 -translate-y-1/2 z-10 flex flex-col rounded-xl overflow-hidden bg-bg-card shadow-md">
        <button
          type="button"
          onClick={() => mapControlsRef.current?.zoomIn()}
          disabled={!mapReady}
          aria-label="지도 확대"
          className="w-10 h-10 grid place-items-center text-text-secondary hover:bg-bg-subtle border-b border-border disabled:opacity-40"
        >
          <Plus size={18} />
        </button>
        <button
          type="button"
          onClick={() => mapControlsRef.current?.zoomOut()}
          disabled={!mapReady}
          aria-label="지도 축소"
          className="w-10 h-10 grid place-items-center text-text-secondary hover:bg-bg-subtle disabled:opacity-40"
        >
          <Minus size={18} />
        </button>
      </div>

      {/* 하단 지역 필터 */}
      <RegionFilter selected={selectedRegion} onChange={setSelectedRegion} />
    </section>
  );
}

export default MapPanel;
