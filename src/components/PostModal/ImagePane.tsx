"use client";

import { useMemo } from "react";
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
        />
      </div>
    </div>
  );
}
