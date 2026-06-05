"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { COMMENT_MENU_HEIGHT_PX } from "./constants";

export type KebabMenuItem =
  | { divider: true; label?: never; icon?: never; danger?: never; onClick?: never }
  | { divider?: false; label: string; icon: React.ReactNode; danger?: boolean; onClick?: () => void };

export type KebabMenuSize = "sm" | "md";

export interface KebabMenuProps {
  items: KebabMenuItem[];
  className?: string;
  portal?: boolean;
  size?: KebabMenuSize;
}

const triggerSizeClasses: Record<KebabMenuSize, string> = {
  md: "w-8 h-8 rounded-full bg-bg-card/90 backdrop-blur-sm border border-border text-text-muted hover:bg-bg-card hover:text-text-secondary",
  sm: "w-6 h-6 text-text-disabled hover:text-text-body",
};

const triggerIconClasses: Record<KebabMenuSize, string> = {
  md: "w-[17px] h-[17px]",
  sm: "w-3.5 h-3.5",
};

const dropdownSizeClasses: Record<KebabMenuSize, string> = {
  md: "min-w-[180px] rounded-2xl py-1.5",
  sm: "min-w-[110px] rounded-xl py-1",
};

const itemSizeClasses: Record<KebabMenuSize, string> = {
  md: "h-[38px] px-3.5 text-body-sm gap-2.5",
  sm: "h-8 px-3 text-caption gap-2",
};

export function KebabMenu({ items, className, portal = false, size = "md" }: KebabMenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // portal 모드: open 직후 동기적으로 위치 계산 (깜빡임 방지)
  useLayoutEffect(() => {
    if (!portal || !open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const isBottomOverflow = rect.bottom + 4 + COMMENT_MENU_HEIGHT_PX > window.innerHeight;
    setPos({
      top: isBottomOverflow ? rect.top - COMMENT_MENU_HEIGHT_PX - 4 : rect.bottom + 4,
      right: Math.max(0, window.innerWidth - rect.right),
    });
  }, [portal, open]);

  useEffect(() => {
    if (!open) return;

    if (portal) {
      // portal 모드: scroll/resize/mousedown 구독
      const closeMenu = () => setOpen(false);
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as Node;
        if (
          menuRef.current && !menuRef.current.contains(target) &&
          buttonRef.current && !buttonRef.current.contains(target)
        ) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", closeMenu, true);
      window.addEventListener("resize", closeMenu);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        window.removeEventListener("scroll", closeMenu, true);
        window.removeEventListener("resize", closeMenu);
      };
    } else {
      // non-portal 모드: containerRef 외부 mousedown만 감지
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as Node;
        if (containerRef.current && !containerRef.current.contains(target)) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [open, portal]);

  const renderDropdown = (positionClass: string, style?: React.CSSProperties) => (
    <div
      ref={menuRef}
      style={style}
      className={cn(
        positionClass,
        "bg-bg-card border border-border-subtle shadow-lg flex flex-col z-50 overflow-hidden",
        dropdownSizeClasses[size]
      )}
    >
      {items.map((item, i) =>
        item.divider ? (
          <div key={i} className="h-px bg-bg my-1 mx-3" />
        ) : (
          <button
            key={i}
            onClick={() => {
              item.onClick?.();
              setOpen(false);
            }}
            className={cn(
              "flex items-center font-medium text-left transition-colors w-full",
              itemSizeClasses[size],
              item.danger ? "text-error hover:bg-error-bg" : "text-text-secondary hover:bg-bg-subtle"
            )}
          >
            <span className={cn(item.danger ? "text-error" : "text-text-disabled", "shrink-0")}>
              {item.icon}
            </span>
            {item.label}
          </button>
        )
      )}
    </div>
  );

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center justify-center transition-all",
          triggerSizeClasses[size]
        )}
        aria-label="더보기"
      >
        <MoreHorizontal className={triggerIconClasses[size]} />
      </button>

      {open && !portal && renderDropdown("absolute top-10 right-0")}

      {open && portal && pos && typeof document !== "undefined" &&
        createPortal(
          renderDropdown("fixed", { top: pos.top, right: pos.right, zIndex: 60 }),
          document.body
        )}
    </div>
  );
}

export default KebabMenu;
