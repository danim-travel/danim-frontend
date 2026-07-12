"use client";

import { memo } from "react";
import Image from "next/image";
import { MapPin } from "lucide-react";

interface FeedCardImageProps {
  thumbnail: string | null;
  description: string;
  spotCount: number;
  priority?: boolean;
  variant?: "panel" | "sheet";
}

function FeedCardImageBase({ thumbnail, description, spotCount, priority = false, variant = "panel" }: FeedCardImageProps) {
  if (variant === "sheet") {
    return (
      <div className="relative w-1/2 self-stretch bg-bg-subtle">
        {thumbnail && (
          <Image
            src={thumbnail}
            alt={description}
            fill
            sizes="50vw"
            loading="eager"
            className="object-cover"
          />
        )}
        {spotCount > 0 && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-pill bg-white text-label font-semibold shadow-sm shrink-0">
            <MapPin size={10} className="text-primary" />
            <span data-testid="spot-count">{spotCount}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[16/9] bg-bg-subtle">
      {thumbnail && (
        <Image
          src={thumbnail}
          alt={description}
          fill
          sizes="(max-width: 1280px) 50vw, 480px"
          priority={priority}
          className="object-cover"
        />
      )}
      {spotCount > 0 && (
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-pill bg-white text-text-primary text-label font-semibold shadow-sm shrink-0">
          <MapPin size={12} className="text-primary" />
          <span data-testid="spot-count">{spotCount}</span>
        </div>
      )}
    </div>
  );
}

export const FeedCardImage = memo(FeedCardImageBase);
