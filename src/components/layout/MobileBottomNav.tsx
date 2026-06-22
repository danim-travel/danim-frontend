"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, Compass, PenLine, MessageCircle, User } from "lucide-react";
import { BottomTabBar } from "./BottomTabBar";

const NAV_ITEMS = [
  { key: "/", label: "홈", icon: <Home size={22} strokeWidth={2} /> },
  { key: "/explore", label: "탐색", icon: <Compass size={22} strokeWidth={2} /> },
  { key: "/write", label: "기록", icon: <PenLine size={22} strokeWidth={2} />, primary: true },
  { key: "/dm", label: "메시지", icon: <MessageCircle size={22} strokeWidth={2} /> },
  { key: "/mypage", label: "MY", icon: <User size={22} strokeWidth={2} /> },
];

function getActiveKey(pathname: string): string {
  if (pathname === "/") return "/";
  return NAV_ITEMS.find((item) => item.key !== "/" && pathname.startsWith(item.key))?.key ?? "";
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const active = getActiveKey(pathname);

  return (
    <div className="md:hidden">
      <BottomTabBar
        items={NAV_ITEMS}
        active={active}
        onNav={(key) => router.push(key)}
      />
    </div>
  );
}
