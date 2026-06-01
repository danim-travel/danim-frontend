import React from "react";

/**
 * Tabs — 탭 전환 (게시글/저장/태그, 팔로워/팔로잉)
 * state: default · selected
 * tokens: --color-text-tertiary/selected-text, --border-focus
 */
export interface TabItem {
  key: string;
  label: string;
  count?: string | number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (key: string) => void;
}

export function Tabs({ items, value, onChange }: TabsProps) {
  return (
    <div
      style={{
        display: "flex",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {items.map((it) => {
        const on = it.key === value;
        return (
          <button
            key={it.key}
            data-state={on ? "selected" : "default"}
            onClick={() => onChange(it.key)}
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-2)",
              padding: "var(--space-4) var(--space-6)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: "var(--text-card-title-size)",
              fontWeight: 700,
              color: on ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
            }}
          >
            {it.icon}
            {it.label}
            {it.count != null && (
              <span
                style={{
                  fontSize: "var(--text-caption-size)",
                  color: on ? "var(--color-primary)" : "var(--color-text-tertiary)",
                }}
              >
                {it.count}
              </span>
            )}
            {on && (
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: -1,
                  height: 2,
                  background: "var(--color-border-focus)",
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
