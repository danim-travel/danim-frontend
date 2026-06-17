"use client";

import Link from "next/link";
import { Search, Bell } from "lucide-react";
import { useUIStore } from "@/store/uiStore";

export function MobileHeader() {
  const { activePanel, setActivePanel, closePanel } = useUIStore();

  return (
    <header className="fixed top-0 inset-x-0 h-14 z-(--z-sidenav) bg-bg-card border-b border-border flex items-center justify-between px-4 md:hidden">
      <Link href="/" className="flex items-center">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-md">
          <span className="text-text-inverse text-sm">✈️</span>
        </div>
      </Link>

      <div className="flex items-center gap-1">
        <button
          onClick={() => activePanel === "search" ? closePanel() : setActivePanel("search")}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-bg-subtle transition-colors"
          aria-label="검색"
        >
          <Search className="w-5 h-5 text-text-muted" strokeWidth={2} />
        </button>
        <button
          onClick={() => setActivePanel("notification")}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-bg-subtle transition-colors"
          aria-label="알림"
        >
          <Bell className="w-5 h-5 text-text-muted" strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
