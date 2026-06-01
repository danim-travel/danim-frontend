import React from "react";

/**
 * MapPin — 지도 마커 (메인 지도)
 * state: default · active(featured)
 * tokens: --color-primary, --color-white, --radius-full, --shadow-card
 */
export interface MapPinProps {
  label?: string;
  featured?: boolean;
  cluster?: boolean;
  count?: number;
}

export function MapPin({ label, featured, cluster, count }: MapPinProps) {
  if (cluster) {
    return (
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "var(--radius-full)",
          background: "var(--color-primary)",
          color: "var(--color-text-inverse)",
          display: "grid",
          placeItems: "center",
          fontSize: "var(--text-card-title-size)",
          fontWeight: 700,
          border: "4px solid rgba(255,255,255,0.85)",
          boxShadow: "var(--shadow-floating-button)",
        }}
      >
        +{count}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-1)" }}>
      <span
        data-state={featured ? "active" : "default"}
        style={{
          width: 44,
          height: 44,
          borderRadius: "var(--radius-full)",
          background: featured ? "var(--color-primary)" : "var(--color-white)",
          color: featured ? "var(--color-text-inverse)" : "var(--color-primary)",
          border: `3px solid ${featured ? "var(--color-white)" : "var(--color-primary)"}`,
          display: "grid",
          placeItems: "center",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
        </svg>
      </span>
      {label && (
        <span
          style={{
            background: "var(--color-white)",
            padding: "var(--space-1) var(--space-3)",
            borderRadius: "var(--radius-full)",
            fontSize: "var(--text-caption-size)",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            boxShadow: "var(--shadow-surface)",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

export default MapPin;
