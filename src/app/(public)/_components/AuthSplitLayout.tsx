import React from "react";
import { BrandPanel } from "./BrandPanel";

/**
 * 인증 화면 좌우 분할 셸. 좌측 브랜드 인트로(BrandPanel) + 우측 카드(children) 구성.
 * 로그인·비밀번호 재설정 페이지가 공유한다.
 */
export function AuthSplitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6 lg:p-16">
      <div className="w-full max-w-[1080px] flex items-center justify-center lg:justify-between gap-24">
        <BrandPanel />
        {children}
      </div>
    </div>
  );
}

export default AuthSplitLayout;
