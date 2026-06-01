import React from "react";
import Card from "../../common/Card/Card";
import Badge from "../../common/Badge/Badge";

/**
 * PlaceCard — 장소/코스 항목 카드 (탐색 · 지도 · 코스)
 * state: default · hover
 * tokens: --post-card-*, --radius-card-comp, --text-*
 */
export interface PlaceCardProps {
  name: string;
  category: string;
  thumbnail?: string;
  rating?: number;
  distance?: string;
}

export function PlaceCard({ name, category, thumbnail, rating, distance }: PlaceCardProps) {
  return (
    <Card padding="none" interactive style={{ overflow: "hidden", display: "flex", gap: "var(--space-3)" }}>
      <div
        style={{
          width: 96,
          flexShrink: 0,
          background: thumbnail ? `center/cover url(${thumbnail})` : "var(--color-background-subtle)",
        }}
      />
      <div style={{ padding: "var(--space-3) var(--space-3) var(--space-3) 0", flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <Badge variant="status">{category}</Badge>
          {rating != null && (
            <span style={{ fontSize: "var(--text-caption-size)", color: "var(--color-text-tertiary)" }}>
              ★ {rating}
            </span>
          )}
        </div>
        <div
          style={{
            marginTop: "var(--space-1)",
            fontSize: "var(--text-card-title-size)",
            fontWeight: "var(--text-card-title-weight)" as React.CSSProperties["fontWeight"],
            color: "var(--color-text-primary)",
          }}
        >
          {name}
        </div>
        {distance && (
          <div style={{ fontSize: "var(--text-caption-size)", color: "var(--color-text-tertiary)" }}>
            {distance}
          </div>
        )}
      </div>
    </Card>
  );
}

export default PlaceCard;
