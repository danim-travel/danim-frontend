"use client";

import type { Spot } from "@/types";
import SpotImages from "./SpotImages";

interface Props {
  spots: Spot[];
  activeSpotIdx: number;
  activeSpot: Spot | undefined;
  onSelectSpot: (idx: number) => void;
}

export default function PostModalImagePane({ spots, activeSpotIdx, activeSpot, onSelectSpot }: Props) {
  return (
    <div className="w-1/2 shrink-0 flex flex-col overflow-hidden bg-bg-subtle">
      {activeSpot && <SpotImages key={activeSpot.spot_id} spot={activeSpot} />}

      <div className="px-6 py-5 bg-bg-card border-t border-border-subtle">
        <div className="flex items-start">
          {spots.map((spot, i) => (
            <div
              key={spot.spot_id}
              className={`flex items-start ${i < spots.length - 1 ? "flex-1" : "flex-none"}`}
            >
              <button
                onClick={() => onSelectSpot(i)}
                className="flex flex-col items-center gap-1.5 shrink-0"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-body-sm font-bold transition-all border-2 shadow-sm ${
                    i === activeSpotIdx
                      ? "bg-primary border-primary text-text-inverse"
                      : "bg-bg-card border-border text-text-disabled"
                  }`}
                >
                  {i + 1}
                </div>
                <span
                  className={`text-tiny font-medium leading-tight max-w-[44px] truncate text-center ${
                    i === activeSpotIdx ? "text-primary" : "text-text-disabled"
                  }`}
                >
                  {spot.location.place_name}
                </span>
              </button>
              {i < spots.length - 1 && (
                <div
                  className={`flex-1 h-px mt-4 mx-1.5 ${i < activeSpotIdx ? "bg-primary" : "bg-border"}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
