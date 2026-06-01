import React from "react";
import { cn } from "@/lib/utils";

export interface MapPinProps { label?: string; featured?: boolean; cluster?: boolean; count?: number; }

export function MapPin({ label, featured, cluster, count }: MapPinProps) {
  if (cluster) {
    return (
      <div className="w-14 h-14 rounded-full bg-primary text-text-inverse grid place-items-center text-[16px] font-bold border-4 border-white/85 shadow-floating-button">
        +{count}
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        data-state={featured ? "active" : "default"}
        className={cn(
          "w-11 h-11 rounded-full grid place-items-center shadow-card border-[3px]",
          featured
            ? "bg-primary text-text-inverse border-white"
            : "bg-white text-primary border-primary"
        )}
      >
        <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
        </svg>
      </span>
      {label && (
        <span className="bg-white px-3 py-1 rounded-pill text-[12px] font-bold text-text shadow-surface whitespace-nowrap">
          {label}
        </span>
      )}
    </div>
  );
}

export default MapPin;
