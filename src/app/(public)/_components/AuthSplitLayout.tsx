import React from "react";
import { BrandPanel } from "./BrandPanel";

/**
 * 인증 화면 좌우 분할 셸. 좌측 브랜드 인트로(BrandPanel) + 우측 카드(children) 구성.
 * 로그인·비밀번호 재설정 페이지가 공유한다.
 */
export function AuthSplitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[1080px] mx-auto px-6 lg:px-16 flex gap-24">
        {/* BrandPanel 컬럼: sticky로 뷰포트 기준 고정, 카드 높이 변화에 영향받지 않음 */}
        <div className="hidden lg:flex items-center sticky top-0 h-screen shrink-0">
          <BrandPanel />
        </div>
        {/* 폼 컬럼: 카드 작을 땐 중앙, 클 땐 자연스럽게 위에서 아래로 */}
        <div className="flex-1 flex items-center justify-center min-h-screen py-16">
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthSplitLayout;
