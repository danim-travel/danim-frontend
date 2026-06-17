"use client";

import { useEffect, useRef } from "react";
import { motion, useDragControls, useMotionValue, animate } from "motion/react";
import type { PanInfo } from "motion/react";

const HEADER_H = 56; // MobileHeader h-14
const NAV_H    = 64; // MobileBottomNav h-16

interface MobileBottomSheetProps {
  children: React.ReactNode;
  /** true = 지도 전체 덮기, false = 반반 (기본) */
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

export function MobileBottomSheet({ children, expanded, onExpandedChange }: MobileBottomSheetProps) {
  const controls = useDragControls();
  const y        = useMotionValue(0);
  const halfY    = useRef(0); // 반반 상태의 y offset

  // 초기 반반 위치 계산 (콘텐츠 영역의 절반만큼 시트를 아래로)
  useEffect(() => {
    const contentH  = window.innerHeight - NAV_H - HEADER_H;
    halfY.current   = contentH / 2;
    y.set(halfY.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // expanded prop이 바뀔 때 애니메이션
  useEffect(() => {
    animate(y, expanded ? 0 : halfY.current, {
      type: "spring", stiffness: 400, damping: 40,
    });
  }, [expanded, y]);

  const onDragEnd = (_: PointerEvent, { offset, velocity }: PanInfo) => {
    if      (velocity.y < -500 || (!expanded && offset.y < -60)) onExpandedChange(true);
    else if (velocity.y >  500 || ( expanded && offset.y >  60)) onExpandedChange(false);
    else animate(y, expanded ? 0 : halfY.current, { type: "spring", stiffness: 400, damping: 40 });
  };

  return (
    <motion.div
      className="fixed left-0 right-0 z-(--z-drawer) flex flex-col bg-bg-card rounded-t-2xl shadow-modal"
      style={{
        bottom: NAV_H,
        height: `calc(100dvh - ${NAV_H}px - ${HEADER_H}px)`,
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
        onClick={() => onExpandedChange(!expanded)}
      >
        <div className="w-10 h-1 rounded-full bg-border-strong" />
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {children}
      </div>
    </motion.div>
  );
}

export default MobileBottomSheet;
