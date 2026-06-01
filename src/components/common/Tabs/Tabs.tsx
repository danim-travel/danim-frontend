import React from "react";
import { cn } from "@/lib/utils";

export interface TabItem { key: string; label: string; count?: string | number; icon?: React.ReactNode; }
export interface TabsProps { items: TabItem[]; value: string; onChange: (key: string) => void; }

export function Tabs({ items, value, onChange }: TabsProps) {
  return (
    <div className="flex border-b border-border">
      {items.map((it) => {
        const on = it.key === value;
        return (
          <button
            key={it.key}
            data-state={on ? "selected" : "default"}
            onClick={() => onChange(it.key)}
            className={cn(
              "relative inline-flex items-center gap-2 px-6 py-4 bg-transparent border-none cursor-pointer text-card-title font-bold",
              on ? "text-text" : "text-text-muted"
            )}
          >
            {it.icon}
            {it.label}
            {it.count != null && (
              <span className={cn("text-caption", on ? "text-primary" : "text-text-muted")}>
                {it.count}
              </span>
            )}
            {on && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-border-focus" />}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
