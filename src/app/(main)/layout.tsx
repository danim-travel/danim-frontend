/**
 * 인증이 필요한 페이지 그룹의 레이아웃.
 * 좌측에 SideNav를 고정하고 우측 영역에 children을 렌더링한다.
 */
import SideNav from '@/components/SideNav'
import { AuthGuard } from './_components/AuthGuard'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-full">
        <SideNav />
        <main className="flex-1 min-w-0 h-full overflow-y-auto overscroll-contain">{children}</main>
      </div>
    </AuthGuard>
  )
}
