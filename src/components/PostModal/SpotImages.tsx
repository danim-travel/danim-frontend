"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Spot } from "@/types";

export default function SpotImages({ spot }: { spot: Spot }) {
  const [idx, setIdx] = useState(0);
  const images = [...spot.images].sort((a, b) => a.img_order - b.img_order);

  if (images.length === 0) {
    return (
      <div className="aspect-square w-full bg-bg-subtle flex items-center justify-center">
        <span className="text-text-placeholder text-sm">이미지 없음</span>
      </div>
    );
  }

  return (
    <div className="aspect-square relative w-full overflow-hidden group bg-bg">
      <Image
        src={images[idx].img_url}
        alt={spot.location.place_name}
        fill
        className="object-contain"
        sizes="500px"
      />
      {images.length > 1 && (
        <>
          {idx > 0 && (
            <button
              onClick={() => setIdx((i) => i - 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/35 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {idx < images.length - 1 && (
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
