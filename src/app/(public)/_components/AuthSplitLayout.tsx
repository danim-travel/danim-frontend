import React from "react";
import { BrandPanel } from "./BrandPanel";

/**
 * 인증 화면 좌우 50/50 분할 셸.
 * 좌측: 3D 캐러셀 (좌우 중앙, 위에서 70% 지점)
 * 우측: 폼 카드 (상하좌우 중앙)
 */
export function AuthSplitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-primary/5 flex relative overflow-hidden">
      {/* 좌상단 블러 오브 */}
      <div className="pointer-events-none absolute -z-10 -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-primary/20 blur-[90px]" />
      {/* 우하단 블러 오브 */}
      <div className="pointer-events-none absolute -z-10 -bottom-24 -right-24 w-[420px] h-[420px] rounded-full bg-primary/20 blur-[90px]" />
      {/* 배경 dot 패턴 */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-dot-pattern" />

      {/* 좌측 영역: 화면 절반, 캐러셀 */}
      <div className="hidden lg:flex w-1/2 h-screen sticky top-0 items-center justify-end pr-24 overflow-hidden">
        <BrandPanel />
      </div>

      {/* 우측 영역: 화면 절반, 폼 카드 상하좌우 중앙 */}
      <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-start pl-24 py-16 pr-8">
        {children}
      </div>
    </div>
  );
}

export default AuthSplitLayout;
