import React from "react";
import { cn } from "@/lib/utils";

export interface SidebarNavItem { key: string; label: string; icon: React.ReactNode; }
export interface SidebarNavProps { items: SidebarNavItem[]; active: string; onNav: (key: string) => void; brand?: React.ReactNode; footer?: React.ReactNode; }

export function SidebarNav({ items, active, onNav, brand, footer }: SidebarNavProps) {
  return (
    <aside className="w-[88px] h-full bg-bg-card shadow-surface flex flex-col items-center py-7 gap-10">
      {brand}
      <nav className="flex flex-col gap-2 w-full px-3">
        {items.map((it) => {
          const on = it.key === active;
          return (
            <button
              key={it.key}
              data-state={on ? "active" : "default"}
              onClick={() => onNav(it.key)}
              className={cn(
                "flex flex-col items-center gap-1 py-2 rounded-lg border-none cursor-pointer",
                on
                  ? "bg-[var(--nav-bg-active)] text-[var(--nav-text-active)]"
                  : "bg-transparent text-[var(--nav-text)]"
              )}
            >
              {it.icon}
              <span className="text-[11px] font-semibold">{it.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="mt-auto">{footer}</div>
    </aside>
  );
}

export default SidebarNav;
