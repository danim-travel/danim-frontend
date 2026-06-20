"use client";
import { Skeleton } from "@/components/common/feedback/Skeleton";

const HEIGHTS = [280, 360, 220, 400, 320, 260, 460, 340, 180, 420, 300, 380];

interface GridSkeletonProps {
  count?: number;
}

export function GridSkeleton({ count = 12 }: GridSkeletonProps) {
  const heights = Array.from({ length: count }, (_, i) => HEIGHTS[i % HEIGHTS.length]);
  const cols = [0, 1, 2, 3].map((col) =>
    heights.filter((_, i) => i % 4 === col)
  );

  return (
    <>
      {/* 모바일: 2열 */}
      <div className="columns-2 gap-3 md:hidden">
        {heights.slice(0, 6).map((h, i) => (
          <div key={i} className="mb-3 break-inside-avoid">
            <Skeleton height={h} radius="card" />
          </div>
        ))}
      </div>

      {/* 데스크탑: 4열 */}
      <div className="hidden md:grid md:grid-cols-4 md:gap-3 md:items-start">
        {cols.map((col, colIdx) => (
          <div key={colIdx} className="flex flex-col gap-3">
            {col.map((h, i) => (
              <Skeleton key={i} height={h} radius="card" />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

export default GridSkeleton;
