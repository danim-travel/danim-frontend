import React from "react";

/**
 * SidebarNav — 좌측 글로벌 네비 (데스크탑 88px)
 * state: default · active
 * tokens: --sidebar-nav-*, --sidebar-padding, --color-*
 */
export interface SidebarNavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
}

export interface SidebarNavProps {
  items: SidebarNavItem[];
  active: string;
  onNav: (key: string) => void;
  brand?: React.ReactNode;
  footer?: React.ReactNode;
}

export function SidebarNav({ items, active, onNav, brand, footer }: SidebarNavProps) {
  return (
    <aside
      style={{
        width: 88,
        height: "100%",
        background: "var(--color-background-card)",
        boxShadow: "var(--shadow-surface)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "var(--sidebar-padding) 0",
        gap: "var(--space-10)",
      }}
    >
      {brand}
      <nav style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", width: "100%", padding: "0 var(--space-3)" }}>
        {items.map((it) => {
          const on = it.key === active;
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
                padding: "var(--space-2) 0",
                borderRadius: "var(--radius-lg)",
                background: on ? "var(--sidebar-nav-active-bg)" : "transparent",
                color: on ? "var(--sidebar-nav-active-fg)" : "var(--sidebar-nav-default-fg)",
                border: "none",
                cursor: "pointer",
              }}
            >
              {it.icon}
              <span
                style={{
                  fontSize: "var(--text-nav-size)",
                  fontWeight: "var(--text-nav-weight)" as React.CSSProperties["fontWeight"],
                }}
              >
                {it.label}
              </span>
            </button>
          );
        })}
      </nav>
      <div style={{ marginTop: "auto" }}>{footer}</div>
    </aside>
  );
}

export default SidebarNav;
