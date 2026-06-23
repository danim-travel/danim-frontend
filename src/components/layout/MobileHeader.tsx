"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { Search, Bell, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/store/uiStore";
import { useNotificationBadgeStore } from "@/store/notificationBadgeStore";
import { useOnClickOutside } from "@/hooks/ui/useOnClickOutside";
import { LogoutModal } from "@/components/common";

export function MobileHeader() {
  const router = useRouter();
  const activePanel = useUIStore((s) => s.activePanel);
  const setActivePanel = useUIStore((s) => s.setActivePanel);
  const closePanel = useUIStore((s) => s.closePanel);
  const unreadCount = useNotificationBadgeStore((s) => s.unreadCount);
  const badgeLabel = unreadCount > 99 ? "99+" : unreadCount;

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(settingsRef, () => setSettingsOpen(false), settingsOpen);

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

        <div ref={settingsRef} className="relative">
          <button
            type="button"
            onClick={() => setSettingsOpen((o) => !o)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-bg-subtle transition-colors"
            aria-label="설정"
            aria-expanded={settingsOpen}
          >
            <Settings className="w-5 h-5 text-text-muted" strokeWidth={2} />
          </button>

          {settingsOpen && (
            <div className="absolute top-full right-0 mt-2 bg-bg-card border border-border rounded-card shadow-modal min-w-[140px] py-1 z-50 overflow-hidden">
              <Link
                href="/settings"
                onClick={() => { setSettingsOpen(false); closePanel() }}
                className="flex px-4 py-2.5 text-body-sm text-text hover:bg-bg active:bg-bg transition-colors"
              >
                내 정보 수정
              </Link>
              <button
                type="button"
                onClick={() => { setSettingsOpen(false); setLogoutModal(true) }}
                className="w-full text-left px-4 py-2.5 text-body-sm text-error hover:bg-bg active:bg-bg transition-colors"
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>

      <LogoutModal open={logoutModal} onClose={() => setLogoutModal(false)} />
    </header>
  );
}
