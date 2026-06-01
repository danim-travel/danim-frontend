import React from "react";

/**
 * BottomTabBar — 모바일 하단 네비
 * state: default · active · primary(중앙 기록 버튼)
 * tokens: --tab-*, --tabbar-padding, --color-primary, --shadow-floating-button
 */
export interface BottomTabItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  primary?: boolean;
}

export interface BottomTabBarProps {
  items: BottomTabItem[];
  active: string;
  onNav: (key: string) => void;
}

export function BottomTabBar({ items, active, onNav }: BottomTabBarProps) {
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        background: "var(--color-background-card)",
        borderTop: "1px solid var(--color-border)",
        padding: "0 var(--tabbar-padding)",
        zIndex: 40,
      }}
    >
      {items.map((it) => {
        const on = it.key === active;
        if (it.primary) {
          return (
            <button
              key={it.key}
              onClick={() => onNav(it.key)}
              aria-label={it.label}
              style={{
                width: 52,
                height: 52,
                marginTop: -24,
                borderRadius: "var(--radius-full)",
                background: "var(--color-primary)",
                color: "var(--color-text-inverse)",
                border: "none",
                display: "grid",
                placeItems: "center",
                boxShadow: "var(--shadow-floating-button)",
                cursor: "pointer",
              }}
            >
              {it.icon}
            </button>
          );
        }
        return (
          <button
            key={it.key}
            data-state={on ? "active" : "default"}
            onClick={() => onNav(it.key)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "var(--space-1)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: on ? "var(--tab-active-fg)" : "var(--tab-default-fg)",
            }}
          >
            {it.icon}
            <span style={{ fontSize: "var(--text-nav-size)", fontWeight: "var(--text-nav-weight)" as React.CSSProperties["fontWeight"] }}>
              {it.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export default BottomTabBar;
