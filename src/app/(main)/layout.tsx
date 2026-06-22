/**
 * 인증이 필요한 페이지 그룹의 레이아웃.
 * 좌측에 SideNav를 고정하고 우측 영역에 children을 렌더링한다.
 */
import SideNav from '@/components/SideNav'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { AuthGuard } from './_components/AuthGuard'
import { SearchDrawer } from './_components/SearchDrawer'
import { NotificationDrawer } from './_components/NotificationDrawer'
import { NotificationBadgeSocket } from './_components/NotificationBadgeSocket'
import { MainScrollRestoration } from './_components/MainScrollRestoration'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <NotificationBadgeSocket />
      <div className="flex h-full relative">
        {/* 데스크톱 전용 SideNav */}
        <div className="max-md:hidden relative z-(--z-sidenav) shrink-0 h-full">
          <SideNav />
        </div>

        {/* 모바일 전용 상단 헤더 */}
        <MobileHeader />

        {/* 콘텐츠 영역 — 모바일: 상단/하단 fixed UI 높이만큼 padding */}
        <MainScrollRestoration>
          {children}
        </MainScrollRestoration>

        {/* 모바일 전용 하단 탭바 */}
        <MobileBottomNav />

        <SearchDrawer />
        <NotificationDrawer />
      </div>
    </AuthGuard>
  )
}
