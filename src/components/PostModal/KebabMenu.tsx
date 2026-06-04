"use client";

import { useState, useRef } from "react";
import { MoreHorizontal } from "lucide-react";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";

type MenuItem =
  | { divider: true; label?: never; icon?: never; danger?: never; onClick?: never }
  | { divider?: false; label: string; icon: React.ReactNode; danger?: boolean; onClick?: () => void };

interface Props {
  items: MenuItem[];
  className?: string;
}

export default function KebabMenu({ items, className }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useOnClickOutside(ref, () => setOpen(false), open);

  return (
    <div className={`relative ${className ?? ""}`} ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 rounded-full bg-bg-card/90 backdrop-blur-sm border border-border flex items-center justify-center text-text-muted hover:bg-bg-card hover:text-text-secondary transition-all"
        aria-label="더보기"
      >
        <MoreHorizontal className="w-[17px] h-[17px]" />
      </button>
      {open && (
        <div className="absolute top-10 right-0 min-w-[180px] bg-bg-card border border-border-subtle rounded-2xl shadow-lg py-1.5 flex flex-col z-50 overflow-hidden">
          {items.map((item, i) =>
            item.divider ? (
              <div key={i} className="h-px bg-bg my-1 mx-3" />
            ) : (
              <button
                key={i}
                onClick={() => { item.onClick?.(); setOpen(false); }}
                className={`flex items-center gap-2.5 h-[38px] px-3.5 text-body-sm font-medium text-left transition-colors ${
                  item.danger ? "text-error hover:bg-error-bg" : "text-text-secondary hover:bg-bg-subtle"
                }`}
              >
                <span className={item.danger ? "text-error" : "text-text-disabled"}>{item.icon}</span>
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
