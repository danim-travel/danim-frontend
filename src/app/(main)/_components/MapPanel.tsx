"use client";

import { useCallback, useMemo, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence, useMotionValue, useTransform, animate as motionAnimate } from "motion/react";
import { Plane } from "lucide-react";
import type { MainFeedItem, NearPostSpot, Post } from "@/types";
import { groupNearbySpots } from "@/lib/map/nearbySpots";
import { usePinColor } from "../_hooks/usePinColor";
import { useNearbySpots } from "../_hooks/useNearbySpots";
import type { Coords } from "../_hooks/useCurrentPosition";
import NearbySpotsCarousel from "./NearbySpotsCarousel";

const FLY_DURATION = 0.9;
const FLY_EASE: [number, number, number, number] = [0.4, 0, 0.6, 1];

// SVG viewBox(0~100) 기준 포물선 제어점 Y (작을수록 더 높이 솟음)
const ARC_PEAK_SVG = 30;

const KakaoMap = dynamic(() => import("@/components/KakaoMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-bg flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 rounded-full border-4 border-warning border-t-transparent animate-spin" />
      <p className="text-base text-text-muted">지도를 불러오는 중...</p>
    </div>
  ),
});

/** 참조가 매번 바뀌면 지도 오버레이 이펙트가 다시 돈다. */
const EMPTY_SPOTS: NearPostSpot[] = [];

interface MapPanelProps {
  focusedPost: MainFeedItem | null;
  focusedPostIndex: number;
  onPinClick: (postId: string, spotIdx: number) => void;
  onResetFocus?: () => void;
  coords: Coords | null;
  onLocationResolved: (coords: Coords) => void;
  /** 주변 장소의 카드 썸네일 또는 선택된 칩을 눌렀을 때 해당 게시글을 연다. */
  onOpenNearbyPost: (postId: string) => void;
  /** solo 모드(`?solo=`)에서는 특정 게시글 전용 화면이라 주변 기록을 띄우지 않는다. */
  isSoloMode?: boolean;
}

export function MapPanel({
  focusedPost,
  focusedPostIndex,
  onPinClick,
  onResetFocus,
  coords,
  onLocationResolved,
  onOpenNearbyPost,
  isSoloMode = false,
}: MapPanelProps) {
  const pinColor = usePinColor(focusedPostIndex);
  const sectionRef = useRef<HTMLElement>(null);

  // 게시글이 포커스되면 번호 핀 + 폴리라인이 주인공이다. 주변 도트는 완전히 숨긴다.
  const nearbyEnabled = !focusedPost && !isSoloMode;
  const { spots } = useNearbySpots(coords, nearbyEnabled);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const visibleSpots = nearbyEnabled ? spots : EMPTY_SPOTS;

  // 좌표가 같은 기록은 핀 하나로 묶는다. 선택 식별자도 post_id가 아닌 그룹 키다 —
  // post_id로 잡으면 같은 장소의 2번째 칩이 지도 핀 선택과 어긋난다.
  const nearbyGroups = useMemo(() => groupNearbySpots(visibleSpots), [visibleSpots]);

  // 이펙트로 리셋하지 않고 파생값으로 둔다. 게시글이 포커스돼 캐러셀이 사라졌을 때,
  // 그리고 목록이 갱신돼 이전 선택이 빠졌을 때 모두 자동으로 해제된다.
  const selectedNearbyKey = nearbyGroups.some((group) => group.key === selectedKey)
    ? selectedKey
    : null;

  // "1탭 선택 / 재탭 열기" 판단은 캐러셀이 소유한다. 여기서는 선택만 받는다.
  const handleGroupSelect = useCallback((groupKey: string) => {
    setSelectedKey(groupKey);
  }, []);

  const clearNearbySelection = useCallback(() => setSelectedKey(null), []);

  // KakaoMap이 memo라 인라인 화살표를 넘기면 memo가 무효가 된다.
  const handleMapPinClick = useCallback(
    (post: Post, pinIndex: number) => onPinClick(post.post_id, pinIndex),
    [onPinClick],
  );

  const [flyKey, setFlyKey] = useState(0);
  const prevIdRef = useRef<string | null>(null);

  useEffect(() => {
    const id = focusedPost?.post.post_id ?? null;
    if (id !== null && id !== prevIdRef.current) {
      prevIdRef.current = id;
      setFlyKey((k) => k + 1);
    }
  }, [focusedPost]);

  const [containerSize, setContainerSize] = useState({ width: 900, height: 600 });

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const progress = useMotionValue(0);

  useEffect(() => {
    if (flyKey === 0) return;
    progress.set(0);
    const ctrl = motionAnimate(progress, 1, { duration: FLY_DURATION, ease: FLY_EASE });
    return () => ctrl.stop();
  }, [flyKey, progress]);

  // 비행기 X: 컨테이너 너비 끝까지
  const planeX = useTransform(progress, [0, 1], [0, containerSize.width]);

  // 비행기 Y: 이차 베지어 M 0,50 Q 50,ARC_PEAK_SVG 100,50 와 수학적으로 일치
  // Y_svg(t) = 50 - 2(50-ARC_PEAK_SVG)×t(1-t)  →  offset = (Y_svg - 50)/100 × h
  const planeY = useTransform(progress, (t) => {
    const offsetPx = -(2 * (50 - ARC_PEAK_SVG) / 100) * containerSize.height * t * (1 - t);
    return offsetPx - 40; // -40: 비행기(80px) 절반 = 수직 중앙 정렬
  });

  // 마스크 너비: 0→100 (SVG viewBox 좌표) — 비행기 위치까지만 대시 선 표시
  const maskWidth = useTransform(progress, [0, 1], [0, 100]);

  const overlayOpacity = useTransform(progress, [0, 0.65, 1], [1, 1, 0]);

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
    <section ref={sectionRef} className="relative isolate flex-1 min-w-0 h-full rounded-2xl overflow-hidden shadow-sm">
      <KakaoMap
        selectedPost={mapPost}
        onPinClick={handleMapPinClick}
        onCurrentLocation={onResetFocus}
        onLocationResolved={onLocationResolved}
        nearbyGroups={nearbyGroups}
        selectedNearbyKey={selectedNearbyKey}
        onNearbyGroupSelect={handleGroupSelect}
        onNearbyPostOpen={onOpenNearbyPost}
        onEmptyMapClick={clearNearbySelection}
      />

      <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-pill bg-bg-card shadow-md text-body-sm font-semibold text-text-primary">
        지도
      </div>

      <NearbySpotsCarousel
        groups={nearbyGroups}
        selectedKey={selectedNearbyKey}
        onSelectGroup={handleGroupSelect}
        onOpenPost={onOpenNearbyPost}
      />

      <AnimatePresence>
        {flyKey > 0 && (
          <motion.div
            key={flyKey}
            className="absolute inset-0 z-20 pointer-events-none overflow-hidden"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.05 }}
          >
            {/* 지도 이동·타일 로딩 완전히 가림 */}
            <motion.div className="absolute inset-0 bg-bg" style={{ opacity: overlayOpacity }} />

            {/* 포물선 대시 선: 비행기가 지나온 구간에 - - - - - 표시 */}
            <motion.svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{ opacity: overlayOpacity }}
            >
              <defs>
                <mask id={`flyMask-${flyKey}`}>
                  <motion.rect x={0} y={0} height={100} fill="white" style={{ width: maskWidth }} />
                </mask>
              </defs>
              <path
                d={`M 0 50 Q 50 ${ARC_PEAK_SVG} 100 50`}
                fill="none"
                stroke={pinColor}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                strokeDasharray="8 6"
                mask={`url(#flyMask-${flyKey})`}
              />
            </motion.svg>

            {/* 비행기: 포물선 위에서 이동 */}
            <motion.div
              className="absolute top-1/2 left-0"
              style={{ x: planeX, y: planeY }}
            >
              <Plane className="w-20 h-20 rotate-45 text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.8)]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default MapPanel;
