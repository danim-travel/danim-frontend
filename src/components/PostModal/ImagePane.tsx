"use client";

import { useEffect, useMemo } from "react";
import type { Spot } from "@/types";
import { Stepper } from "@/components/common";
import SpotImages from "./SpotImages";

interface Props {
  spots: Spot[];
  activeSpotIdx: number;
  activeSpot: Spot | undefined;
  onSelectSpot: (idx: number) => void;
}

export default function PostModalImagePane({ spots, activeSpotIdx, activeSpot, onSelectSpot }: Props) {
  // 모달 열림 시 각 스팟의 대표 이미지(첫 장)만 저우선순위로 preload.
  // 모든 이미지를 한꺼번에 fetch하면 대역폭이 활성 스팟 이미지 로드를 가로채
  // LCP가 늘어진다. 활성 스팟의 나머지 이미지는 SpotImages가 슬라이드 인접 슬롯
  // 기준으로 lazy / eager 를 결정한다.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const imgs: HTMLImageElement[] = [];
    spots.forEach((spot) => {
      const first = spot.images[0];
      if (!first) return;
      const image = new window.Image();
      // 일부 브라우저(Chromium 계열)만 지원 — typed cast 사용
      (image as HTMLImageElement & { fetchPriority?: string }).fetchPriority = "low";
      image.decoding = "async";
      image.src = first.img_url;
      imgs.push(image);
    });
    return () => {
      // 메모리 해제 힌트 (브라우저가 결국 GC하지만 명시)
      imgs.length = 0;
    };
  }, [spots]);
  const steps = useMemo(
    () => spots.map((s) => ({ label: s.location.place_name })),
    [spots]
  );

  return (
    <div className="w-full h-[45%] shrink-0 md:w-1/2 md:h-auto flex flex-col overflow-hidden bg-bg-subtle">
      {activeSpot && <SpotImages key={activeSpot.spot_id} spot={activeSpot} />}

      <div className="px-5 py-5 md:px-6 md:py-5 bg-bg-card border-t border-border-subtle">
        <Stepper
          steps={steps}
          current={activeSpotIdx}
          onStepClick={onSelectSpot}
          showLabels={false}
        />
      </div>
    </div>
  );
}
