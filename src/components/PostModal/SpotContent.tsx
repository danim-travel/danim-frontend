"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SPOT_CONTENT_CLAMP_LINES } from "./constants";

interface Props {
  content: string;
}

// scrollHeight vs clampedHeight 비교 시 floating-point 오차 허용폭(px).
const OVERFLOW_TOLERANCE_PX = 1;

export default function SpotContent({ content }: Props) {
  const ref = useRef<HTMLParagraphElement>(null);
  // 더보기 - 펼쳐진 상태인지
  const [expanded, setExpanded] = useState(false);
  // 텍스트가 6줄 초과했는지
  const [isOverflowing, setIsOverflowing] = useState(false);
  // 텍스트 6줄의 높이값
  const [maxHeight, setMaxHeight] = useState<number | null>(null);

  useEffect(() => {
    setExpanded(false);
  }, [content]);

  // 6줄 높이를 line-height × SPOT_CONTENT_CLAMP_LINES 로 실측. CSS line-clamp 대신 max/min-height 고정
  // 방식을 쓰는 이유: spot 전환 시 모달 전체 높이를 일정하게 유지하기 위해 본문 박스 높이를
  // 항상 6줄로 잡아야 함(짧은 본문도 같은 자리 차지). ResizeObserver는 폰트 swap·창 리사이즈·줌 등
  // line-height가 바뀌는 모든 케이스에 재측정 보장.
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

  return (
    <div className="mb-5 relative">
      {/* max height 동적 값 계산 스타일 예외 */}
      <p
        ref={ref}
        style={maxHeight ? { maxHeight, minHeight: maxHeight } : undefined}
        className={`text-body-sm text-text-body leading-[1.75] whitespace-pre-line ${
          expanded ? "overflow-y-auto scrollbar-none" : "overflow-hidden"
        }`}
      >
        {content}
      </p>
      {isOverflowing && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="absolute bottom-0 right-0 pl-10 text-caption font-medium text-text-disabled hover:text-text-body transition-colors bg-gradient-to-l from-bg-card from-50% to-transparent"
        >
          더 보기
        </button>
      )}
    </div>
  );
}
