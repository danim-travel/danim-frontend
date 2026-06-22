"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { SPOT_CONTENT_CLAMP_LINES } from "./constants";

interface Props {
  content: string;
}

const OVERFLOW_TOLERANCE_PX = 1;

export default function SpotContent({ content }: Props) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [maxHeight, setMaxHeight] = useState<number | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);
  // content 변경 시 render 중 setState로 상태 초기화 — effect 내 setState 패턴 회피
  const [prevContent, setPrevContent] = useState(content);
  if (prevContent !== content) {
    setPrevContent(content);
    setExpanded(false);
    setIsAtBottom(false);
  }

  // expanded 상태가 바뀔 때 스크롤 위치 초기화 및 바닥 여부 재측정
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = 0;
    setIsAtBottom(el.scrollHeight <= el.clientHeight + OVERFLOW_TOLERANCE_PX);
  }, [expanded]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
      const clampedHeight = lineHeight * SPOT_CONTENT_CLAMP_LINES;
      setMaxHeight(clampedHeight);
      setIsOverflowing(el.scrollHeight > clampedHeight + OVERFLOW_TOLERANCE_PX);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [content]);

  const handleScroll = (e: React.UIEvent<HTMLParagraphElement>) => {
    const el = e.currentTarget;
    setIsAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - OVERFLOW_TOLERANCE_PX);
  };

  return (
    <div className="mb-5 relative">
      <p
        ref={ref}
        onScroll={handleScroll}
        style={maxHeight ? { maxHeight, minHeight: maxHeight } : undefined}
        className={`text-body-sm text-text-body leading-[1.75] whitespace-pre-line ${
          expanded ? "overflow-y-auto scrollbar-none" : "overflow-hidden"
        }`}
      >
        {content}
      </p>

      {/* 접힌 상태 — 더 보기 버튼 */}
      {isOverflowing && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="absolute bottom-0 right-0 pl-10 text-caption font-medium text-primary hover:text-primary/70 transition-colors bg-gradient-to-l from-bg-card from-50% to-transparent"
        >
          더 보기
        </button>
      )}

      {/* 펼친 상태 — 스크롤 가능 표시 */}
      {expanded && !isAtBottom && (
        <div className="absolute bottom-0 left-0 right-0 h-7 flex items-end justify-center pb-0.5 bg-gradient-to-t from-bg-card to-transparent pointer-events-none">
          <ChevronDown size={14} className="text-text-muted" />
        </div>
      )}
    </div>
  );
}
