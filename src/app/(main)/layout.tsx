/**
 * 인증이 필요한 페이지 그룹의 레이아웃.
 * 좌측에 SideNav를 고정하고 우측 영역에 children을 렌더링한다.
 */
import SideNav from '@/components/SideNav'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
      <SideNav />
      <main className="flex-1 min-w-0 h-full overflow-hidden">{children}</main>
    </div>
  )
}

// TODO: 기능 구현이 모두 끝나면 AuthGuard로 children을 감싸 비로그인 사용자를 /login으로 리다이렉트한다.
