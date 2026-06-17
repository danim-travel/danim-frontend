"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useDragControls, useMotionValue, animate } from "motion/react";
import type { PanInfo } from "motion/react";

const NAV_H   = 64;   // MobileBottomNav h-16
const PEEK_H  = 120;  // 접힌 상태에서 시트가 노출되는 높이
const TOP_GAP = 60;   // 펼쳐졌을 때 시트 위에 남기는 여백 (지도 일부 노출)

export function MobileBottomSheet({ children }: { children: React.ReactNode }) {
  const controls       = useDragControls();
  const y              = useMotionValue(0);
  const [expanded, setExpanded] = useState(false);
  const collapsedY     = useRef(0); // 접힌 상태의 y offset

  useEffect(() => {
    // 시트 전체 높이 = 뷰포트 - 탭바 - 상단 여백
    const sheetH = window.innerHeight - NAV_H - TOP_GAP;
    collapsedY.current = sheetH - PEEK_H;
    y.set(collapsedY.current); // 초기: 접힌 상태
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const snap = (toExpanded: boolean) => {
    animate(y, toExpanded ? 0 : collapsedY.current, {
      type: "spring",
      stiffness: 400,
      damping: 40,
    });
    setExpanded(toExpanded);
  };

  const onDragEnd = (_: PointerEvent, { offset, velocity }: PanInfo) => {
    if      (velocity.y < -500 || (!expanded && offset.y < -50)) snap(true);
    else if (velocity.y >  500 || ( expanded && offset.y >  50)) snap(false);
    else    snap(expanded); // 애매하면 현재 상태 유지
  };

  return (
    <motion.div
      className="fixed left-0 right-0 z-(--z-drawer) flex flex-col bg-bg-card rounded-t-2xl shadow-modal"
      style={{
        bottom : NAV_H,
        height : `calc(100dvh - ${NAV_H}px - ${TOP_GAP}px)`,
        y,
      }}
      drag="y"
      dragControls={controls}
      dragListener={false}
      dragConstraints={{ top: 0 }}
      dragElastic={{ top: 0.05, bottom: 0.3 }}
      dragMomentum={false}
      onDragEnd={onDragEnd}
    >
      {/* 드래그 핸들 — 드래그·탭 모두 지원 */}
      <div
        className="flex justify-center py-3 shrink-0 select-none touch-none cursor-grab active:cursor-grabbing"
        onPointerDown={(e) => controls.start(e)}
        onClick={() => snap(!expanded)}
      >
        <div className="w-10 h-1 rounded-full bg-border-strong" />
      </div>

      {/* 피드 콘텐츠 — FeedPanel 이 내부 스크롤을 관리 */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {children}
      </div>
    </motion.div>
  );
}

export default MobileBottomSheet;
