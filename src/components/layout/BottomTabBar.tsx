import React from "react";
import { cn } from "@/lib/utils";

export interface BottomTabItem { key: string; label: string; icon: React.ReactNode; primary?: boolean; }
export interface BottomTabBarProps { items: BottomTabItem[]; active: string; onNav: (key: string) => void; }

export function BottomTabBar({ items, active, onNav }: BottomTabBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 flex items-center justify-around bg-bg-card border-t border-border px-2 z-40">
      {items.map((it) => {
        const on = it.key === active;
        if (it.primary) {
          return (
            <button
              key={it.key}
              onClick={() => onNav(it.key)}
              aria-label={it.label}
              className="w-[52px] h-[52px] -mt-6 rounded-full bg-primary text-text-inverse border-none grid place-items-center shadow-floating-button cursor-pointer"
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
            className={cn(
              "flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer",
              on ? "text-[var(--tab-text-active)]" : "text-[var(--tab-text)]"
            )}
          >
            {it.icon}
            <span className="text-[11px] font-semibold">{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default BottomTabBar;
