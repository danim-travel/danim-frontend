"use client";

import { useMemo, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence, useMotionValue, useTransform, animate as motionAnimate } from "motion/react";
import { Plane } from "lucide-react";
import type { MainFeedItem, Post } from "@/types";
import { usePinColor } from "../_hooks/usePinColor";

const FLY_DURATION = 0.9;
const FLY_EASE: [number, number, number, number] = [0.4, 0, 0.6, 1];

// SVG viewBox(0~100) 기준 포물선 제어점 Y (작을수록 더 높이 솟음)
const ARC_PEAK_SVG = 30;

const KakaoMap = dynamic(() => import("@/components/KakaoMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-bg-subtle animate-pulse" />,
});

interface MapPanelProps {
  focusedPost: MainFeedItem | null;
  focusedPostIndex: number;
  onPinClick: (postId: string, spotIdx: number) => void;
  onResetFocus?: () => void;
}

export function MapPanel({ focusedPost, focusedPostIndex, onPinClick, onResetFocus }: MapPanelProps) {
  const pinColor = usePinColor(focusedPostIndex);
  const sectionRef = useRef<HTMLElement>(null);

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
    <section ref={sectionRef} className="relative flex-1 min-w-0 h-full rounded-2xl overflow-hidden shadow-sm">
      <KakaoMap
        selectedPost={mapPost}
        onPinClick={(post, pinIndex) => onPinClick(post.post_id, pinIndex)}
        onCurrentLocation={onResetFocus}
      />

      <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-pill bg-bg-card shadow-md text-body-sm font-semibold text-text-primary">
        지도
      </div>

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
