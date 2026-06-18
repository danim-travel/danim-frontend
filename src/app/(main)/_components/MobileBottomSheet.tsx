"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useDragControls, useMotionValue, useMotionValueEvent, animate } from "motion/react";
import type { PanInfo } from "motion/react";

const HEADER_H = 64; // MobileHeader h-16
const NAV_H    = 64; // MobileBottomNav h-16
const HANDLE_H = 56; // 시트가 접혔을 때 남겨둘 핸들 영역 (드래그·탭 영역 보장)

type Position = "expanded" | "half" | "collapsed";

interface MobileBottomSheetProps {
  children: React.ReactNode;
  /** true = 지도 전체 덮기, false = 반반 (기본). 부모의 명령형 reset 용도. */
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  /** 시트의 현재 y offset (콘텐츠 영역 상단 기준) — 지도 영역 계산용 */
  onYChange?: (y: number) => void;
}

export function MobileBottomSheet({ children, expanded, onExpandedChange, onYChange }: MobileBottomSheetProps) {
  const controls = useDragControls();
  const y        = useMotionValue(0);
  const halfY    = useRef(0);   // 반반 상태의 y offset
  const maxY     = useRef(0);   // 접힘 상태의 y offset (콘텐츠 영역 하단 - 핸들 높이)
  const [position, setPosition] = useState<Position>("half");
  const [bounds, setBounds]     = useState({ top: 0, bottom: 0 });

  // 초기 위치 계산
  useEffect(() => {
    const contentH = window.innerHeight - NAV_H - HEADER_H;
    halfY.current  = contentH / 2;
    maxY.current   = Math.max(contentH - HANDLE_H, halfY.current);
    setBounds({ top: 0, bottom: maxY.current });
    y.set(halfY.current);
    onYChange?.(halfY.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useMotionValueEvent(y, "change", (v) => {
    onYChange?.(v);
  });

  // 부모가 expanded prop으로 명령적 리셋(예: 게시글 선택 시 false → half).
  // collapsed 상태에서 다시 reset이 들어오면 half로 복귀시키는 의도라 effect 사용.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPosition(expanded ? "expanded" : "half");
  }, [expanded]);

  // position 변경 시 애니메이션
  useEffect(() => {
    const target = position === "expanded" ? 0 : position === "half" ? halfY.current : maxY.current;
    animate(y, target, { type: "spring", stiffness: 400, damping: 40 });
  }, [position, y]);

  const goTo = (next: Position) => {
    setPosition(next);
    // 부모의 expanded 상태와 동기화 (expanded는 'expanded' 위치만 의미)
    if (next === "expanded" && !expanded) onExpandedChange(true);
    if (next !== "expanded" && expanded)  onExpandedChange(false);
  };

  const onDragEnd = (_: PointerEvent, { velocity }: PanInfo) => {
    const current = y.get();
    // velocity 우선
    if (velocity.y < -500) {
      goTo(position === "collapsed" ? "half" : "expanded");
      return;
    }
    if (velocity.y > 500) {
      goTo(position === "expanded" ? "half" : "collapsed");
      return;
    }
    // 최단 거리 스냅
    const points: { p: Position; v: number }[] = [
      { p: "expanded",  v: 0 },
      { p: "half",      v: halfY.current },
      { p: "collapsed", v: maxY.current },
    ];
    const nearest = points.reduce((a, b) =>
      Math.abs(current - a.v) < Math.abs(current - b.v) ? a : b,
    );
    goTo(nearest.p);
  };

  const onHandleClick = () => {
    // 토글: expanded ↔ half ↔ collapsed 순환
    const next: Position =
      position === "collapsed" ? "half" :
      position === "half"      ? "expanded" :
                                 "half";
    goTo(next);
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
      dragConstraints={bounds}
      dragElastic={{ top: 0.05, bottom: 0.05 }}
      dragMomentum={false}
      onDragEnd={onDragEnd}
    >
      {/* 드래그 핸들 — 드래그·탭 모두 지원 */}
      <div
        className="flex justify-center py-3 shrink-0 select-none touch-none cursor-grab active:cursor-grabbing"
        onPointerDown={(e) => controls.start(e)}
        onClick={onHandleClick}
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
