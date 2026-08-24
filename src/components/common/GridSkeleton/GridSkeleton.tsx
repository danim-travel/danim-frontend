"use client";
import { Skeleton } from "@/components/common/feedback/Skeleton";
import { MasonryGrid } from "@/components/common/MasonryGrid/MasonryGrid";

/**
 * 자리표시 비율. 응답 전에는 진짜 썸네일 크기를 알 수 없으므로,
 * 세로형이 많은 여행 사진 분포를 대략 흉내낸 값을 순환시킨다.
 *
 * 실제 그리드와 **같은 컴포넌트·같은 분배 알고리즘**을 태우는 것이 요점이다.
 * 예전에는 스켈레톤만 `grid-cols-4` + 고정 픽셀 높이라 실데이터로 바뀌는 순간
 * 레이아웃 알고리즘 자체가 달라져 크게 튀었고, 태블릿(3열) 케이스는 아예 없었다.
 */
const PLACEHOLDER_RATIOS = [0.8, 0.67, 1, 0.75, 1.33, 0.6, 1, 0.8, 0.56, 1.5, 0.75, 1];

interface GridSkeletonProps {
  count?: number;
}

export function GridSkeleton({ count = 12 }: GridSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <MasonryGrid
      items={items}
      getKey={(i) => String(i)}
      getRatio={(i) => PLACEHOLDER_RATIOS[i % PLACEHOLDER_RATIOS.length]}
      renderItem={() => <Skeleton width="100%" height="100%" radius="card" />}
    />
  );
}

export default GridSkeleton;
