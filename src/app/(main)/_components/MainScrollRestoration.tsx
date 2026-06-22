"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * (main) 그룹의 `<main overflow-y-auto>` 컨테이너 스크롤 위치를 path별로 sessionStorage에 보존.
 * Next.js 자동 scroll restoration은 window 스크롤만 대상으로 하므로 컨테이너 스크롤은 직접 처리.
 * 인터셉트 모달 닫기(router.back) 시 그리드 스크롤이 맨 위로 점프하는 회귀를 막는다.
 */
const KEY_PREFIX = "main-scroll:";

export function MainScrollRestoration({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const ref = useRef<HTMLElement>(null);

  // path 변경 시 복원
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    try {
      const saved = sessionStorage.getItem(KEY_PREFIX + pathname);
      if (saved) {
        el.scrollTop = Number(saved) || 0;
      } else {
        el.scrollTop = 0;
      }
    } catch {}
  }, [pathname]);

  // 스크롤 변경을 throttled로 저장
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let rafId = 0;
    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        try { sessionStorage.setItem(KEY_PREFIX + pathname, String(el.scrollTop)); } catch {}
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [pathname]);

  return (
    <main ref={ref} className="flex-1 min-w-0 h-full overflow-y-auto overscroll-contain pt-16 md:pt-0 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
      {children}
    </main>
  );
}
