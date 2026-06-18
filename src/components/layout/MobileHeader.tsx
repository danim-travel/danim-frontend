"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, Bell } from "lucide-react";
import { useUIStore } from "@/store/uiStore";

export function MobileHeader() {
  const { activePanel, setActivePanel, closePanel } = useUIStore();

  return (
    <header className="fixed top-0 inset-x-0 h-16 z-(--z-sidenav) bg-bg-card border-b border-border flex items-center justify-between px-4 md:hidden">
      <Link href="/" className="flex items-center" onClick={() => closePanel()}>
        <Image src="/favicon.svg" alt="Danim" width={32} height={32} />
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
          onClick={() => activePanel === "notification" ? closePanel() : setActivePanel("notification")}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-bg-subtle transition-colors"
          aria-label="알림"
        >
          <Bell className="w-5 h-5 text-text-muted" strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
