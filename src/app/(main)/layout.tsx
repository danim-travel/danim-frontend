/**
 * 인증이 필요한 페이지 그룹의 레이아웃.
 * 좌측에 SideNav를 고정하고 우측 영역에 children을 렌더링한다.
 */
import SideNav from '@/components/SideNav'
import { AuthGuard } from './_components/AuthGuard'
import { SearchDrawer } from './_components/SearchDrawer'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-full relative">
        {/* z-10: 드로어가 사이드바 뒤에서 슬라이드되도록 SideNav를 드로어 위에 배치 */}
        <div className="relative z-10 shrink-0 h-full">
          <SideNav />
        </div>
        <main className="flex-1 min-w-0 h-full overflow-y-auto overscroll-contain">{children}</main>
        <SearchDrawer />
      </div>
    </AuthGuard>
  )
}
