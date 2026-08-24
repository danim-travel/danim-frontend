"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { NearPostSpot } from "@/types";

/** 1km 미만은 m로 끊어야 "0.8km"보다 읽힌다. 지도 도트 라벨과 같은 규칙. */
function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

interface NearbySpotsCarouselProps {
  spots: NearPostSpot[];
  selectedId: string | null;
  /** 미선택 칩을 누른 경우 — 지도 도트와 양방향으로 선택을 맞춘다. */
  onSelect: (postId: string) => void;
  /** 이미 선택된 칩을 다시 누른 경우 — 게시글을 연다. */
  onOpen: (postId: string) => void;
}

export function NearbySpotsCarousel({
  spots,
  selectedId,
  onSelect,
  onOpen,
}: NearbySpotsCarouselProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // 지도 도트를 눌러 선택이 바뀌었을 때도 해당 칩이 보이도록 따라 움직인다.
  useEffect(() => {
    if (!selectedId) return;
    const chip = listRef.current?.querySelector(`[data-post-id="${selectedId}"]`);
    chip?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [selectedId]);

  if (spots.length === 0) return null;

  return (
    <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none">
      <div className="bg-gradient-to-t from-bg-card/95 to-transparent px-3 pb-3 pt-8 pointer-events-auto">
        <p className="mb-2 text-body-sm font-semibold text-text">내 주변 기록</p>

        <div
          ref={listRef}
          aria-label="내 주변 기록"
          className="flex gap-2 overflow-x-auto scrollbar-none snap-x snap-mandatory"
        >
          {spots.map((spot) => {
            const isSelected = spot.post_id === selectedId;
            return (
              <button
                key={spot.post_id}
                type="button"
                data-post-id={spot.post_id}
                aria-pressed={isSelected}
                onClick={() => (isSelected ? onOpen(spot.post_id) : onSelect(spot.post_id))}
                className={`shrink-0 snap-start flex items-center gap-2 rounded-pill bg-bg-card py-1.5 pl-1.5 pr-3 shadow-md transition-shadow ${
                  isSelected ? "ring-2 ring-primary" : "hover:shadow-lg"
                }`}
              >
                <span className="relative size-10 shrink-0 overflow-hidden rounded-full bg-bg-subtle">
                  <Image
                    src={spot.thumbnail}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </span>
                <span className="flex flex-col items-start">
                  <span className="max-w-28 truncate text-body-sm font-medium text-text">
                    {spot.place_name}
                  </span>
                  <span className="text-caption text-text-muted">
                    {formatDistance(spot.distance)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default NearbySpotsCarousel;
