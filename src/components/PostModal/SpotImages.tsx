"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Spot } from "@/types";

export default function SpotImages({ spot }: { spot: Spot }) {
  const [idx, setIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const images = useMemo(
    () => [...spot.images].sort((a, b) => a.img_order - b.img_order),
    [spot.images]
  );

  const hasMultiple = images.length > 1;
  const isFirst = idx === 0;
  const isLast = idx === images.length - 1;

  const prev = () => setIdx((i) => Math.max(0, i - 1));
  const next = () => setIdx((i) => Math.min(images.length - 1, i + 1));

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -50 && !isLast) next();
    else if (dx > 50 && !isFirst) prev();
    touchStartX.current = null;
  };

  if (images.length === 0) {
    return (
      <div className="flex-1 min-h-0 w-full bg-bg-subtle flex items-center justify-center">
        <span className="text-text-placeholder text-sm">이미지 없음</span>
      </div>
    );
  }

  return (
    <div
      className="flex-1 min-h-0 relative w-full overflow-hidden group bg-bg"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 블러 백드롭 — 활성 슬라이드의 동일 이미지를 재사용하므로 브라우저 캐시 적중 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[idx].img_url}
        alt=""
        aria-hidden
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-60"
      />

      {/* 슬라이드 트랙 — 모든 이미지를 가로로 배치하고 translateX로 이동.
          현재/직전/직후 슬라이드만 eager, 나머지는 lazy 로 미리 큐잉되지 않도록 한다. */}
      <div
        className="absolute inset-0 flex transition-transform duration-300 ease-in-out"
        style={{ transform: `translateX(-${idx * 100}%)` }}
      >
        {images.map((image, i) => {
          const isNear = Math.abs(i - idx) <= 1;
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={image.img_url}
              src={image.img_url}
              alt={i === idx ? spot.location.place_name : ""}
              loading={isNear ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={i === idx ? "high" : "low"}
              className="w-full h-full object-contain shrink-0"
            />
          );
        })}
      </div>

      {hasMultiple && (
        <>
          {!isFirst && (
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/35 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {!isLast && (
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/35 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`rounded-full transition-all duration-200 ${
                  i === idx ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
