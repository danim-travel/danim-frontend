import React from "react";
import { bgCoverStyle } from "@/lib/utils";
import Card from "../../common/Card/Card";
import Badge from "../../common/Badge/Badge";

export interface PlaceCardProps { name: string; category: string; thumbnail?: string; rating?: number; distance?: string; }

export function PlaceCard({ name, category, thumbnail, rating, distance }: PlaceCardProps) {
  return (
    <Card padding="none" interactive className="overflow-hidden flex gap-3">
      <div
        className="w-24 shrink-0 bg-bg-subtle"
        style={bgCoverStyle(thumbnail)}
      />
      <div className="py-3 pr-3 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Badge variant="status">{category}</Badge>
          {rating != null && <span className="text-[12px] text-text-muted">★ {rating}</span>}
        </div>
        <div className="mt-1 text-[16px] font-semibold text-text">{name}</div>
        {distance && <div className="text-[12px] text-text-muted">{distance}</div>}
      </div>
    </Card>
  );
}

export default PlaceCard;
