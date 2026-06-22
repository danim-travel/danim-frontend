"use client";

import Image from "next/image";
import { Search, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/store/uiStore";
import { useNotificationBadgeStore } from "@/store/notificationBadgeStore";

export function MobileHeader() {
  const router = useRouter();
  const activePanel = useUIStore((s) => s.activePanel);
  const setActivePanel = useUIStore((s) => s.setActivePanel);
  const closePanel = useUIStore((s) => s.closePanel);
  const unreadCount = useNotificationBadgeStore((s) => s.unreadCount);
  const badgeLabel = unreadCount > 99 ? "99+" : unreadCount;

  const goHome = () => {
    router.push('/')
    closePanel()
  }

  return (
    <header className="fixed top-0 inset-x-0 h-16 z-(--z-sidenav) bg-bg-card border-b border-border flex items-center justify-between px-4 md:hidden">
      <button type="button" onClick={goHome} className="flex items-center cursor-pointer">
        <Image src="/logo.svg" alt="Danim" width={32} height={32} />
      </button>

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
          className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-bg-subtle transition-colors"
          aria-label="알림"
        >
          <Bell className="w-5 h-5 text-text-muted" strokeWidth={2} />
          {!!unreadCount && (
            <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full bg-error text-white text-[10px] font-bold leading-none">
              {badgeLabel}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
