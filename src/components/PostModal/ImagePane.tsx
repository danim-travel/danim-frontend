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
  // 모달 열릴 때 모든 스팟 이미지를 브라우저에 preload
  useEffect(() => {
    spots.forEach(spot => {
      spot.images.forEach(img => {
        const image = new window.Image()
        image.src = img.img_url
      })
    })
  }, [spots])
  const steps = useMemo(
    () => spots.map((s) => ({ label: s.location.place_name })),
    [spots]
  );

  return (
    <div className="w-full h-[45%] shrink-0 md:w-1/2 md:h-auto flex flex-col overflow-hidden bg-bg-subtle">
      {activeSpot && <SpotImages key={activeSpot.spot_id} spot={activeSpot} />}

      <div className="px-6 py-5 bg-bg-card border-t border-border-subtle">
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
