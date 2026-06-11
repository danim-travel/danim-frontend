"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Spot } from "@/types";

const IMAGE_SIZES = "(max-width: 1040px) 48vw, 500px";

export default function SpotImages({ spot }: { spot: Spot }) {
  const [idx, setIdx] = useState(0);
  const images = useMemo(
    () => [...spot.images].sort((a, b) => a.img_order - b.img_order),
    [spot.images]
  );

  const hasMultiple = images.length > 1
  const isFirst = idx === 0
  const isLast = idx === images.length - 1

  if (images.length === 0) {
    return (
      <div className="flex-1 min-h-0 w-full bg-bg-subtle flex items-center justify-center">
        <span className="text-text-placeholder text-sm">이미지 없음</span>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 relative w-full overflow-hidden group bg-bg">
      {/* 블러 백드롭 — 장식용이라 최적화 불필요, 메인 이미지와 동일 URL로 브라우저 캐시 재사용 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[idx].img_url}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-60"
      />
      <Image
        src={images[idx].img_url}
        alt={spot.location.place_name}
        fill
        priority
        className="object-contain relative"
        sizes={IMAGE_SIZES}
      />
      {hasMultiple && (
        <>
          {!isFirst && (
            <button
              onClick={() => setIdx((i) => i - 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/35 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {!isLast && (
            <button
              onClick={() => setIdx((i) => i + 1)}
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
