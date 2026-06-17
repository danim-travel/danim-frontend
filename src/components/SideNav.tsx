"use client";

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Home, Compass, PenLine, Search, MessageCircle, Bell, Settings, type LucideIcon } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useNotificationBadgeStore } from '@/store/notificationBadgeStore'
import { Avatar } from '@/components/common'

const NAV_LINKS = [
  { href: '/', label: '홈', Icon: Home },
  { href: '/explore', label: '탐색', Icon: Compass },
  { href: '/write', label: '기록', Icon: PenLine },
  { href: '/dm', label: '메시지', Icon: MessageCircle },
]

type NavButtonProps = {
  label: string
  Icon: LucideIcon
  onClick: () => void
  active?: boolean
  badgeCount?: number
}

function NavButton({ label, Icon, onClick, active, badgeCount }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center gap-1 w-full py-3 rounded-xl transition-all ${active ? 'bg-primary/10' : 'hover:bg-bg-subtle'}`}
    >
      <span className="relative">
        <Icon className={`w-[22px] h-[22px] ${active ? 'text-primary' : 'text-text-disabled'}`} strokeWidth={active ? 2.5 : 2} />
        {badgeCount !== undefined && badgeCount > 0 && (
          <span
            aria-label={`읽지 않은 알림 ${badgeCount}개`}
            className="absolute -top-1 -right-2 min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full bg-error text-text-inverse text-[9px] font-bold leading-none"
          >
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </span>
      <span className={`text-[9px] font-semibold tracking-wide ${active ? 'text-primary' : 'text-text-disabled'}`}>{label}</span>
    </button>
  )
}

type NavLinkProps = {
  href: string
  label?: string
  Icon: LucideIcon
  active: boolean
  onClick?: () => void
}

function NavLink({ href, label, Icon, active, onClick }: NavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 w-full py-3 rounded-xl transition-all ${active ? 'bg-primary/10' : 'hover:bg-bg-subtle'}`}
    >
      <Icon className={`w-[22px] h-[22px] ${active ? 'text-primary' : 'text-text-disabled'}`} strokeWidth={active ? 2.5 : 2} />
      {label && <span className={`text-[9px] font-semibold tracking-wide ${active ? 'text-primary' : 'text-text-disabled'}`}>{label}</span>}
    </Link>
  )
}

export default function SideNav() {
  const pathname = usePathname()
  const { activePanel, setActivePanel, closePanel } = useUIStore()
  const user = useAuthStore((s) => s.user)

  // 알림 미읽음 개수 — WS push 기반 실시간 카운트
  const unreadCount = useNotificationBadgeStore((s) => s.unreadCount)

  return (
    <nav className="w-(--sidebar-width) bg-bg-card border-r border-border flex flex-col items-center shrink-0 h-full py-4">
      {/* 메인 로고, 클릭하면 홈으로 이동 */}
      <Link href="/" onClick={closePanel} className="mb-5">
        <Image src="/favicon.svg" alt="Danim" width={40} height={40} className="rounded-lg shadow-md hover:shadow-lg transition-shadow" />
      </Link>

      {/* 메인 네비게이션 링크 */}
      <div className="flex flex-col items-center gap-0.5 flex-1 w-full px-2">
        {/* 메인 네비게이션 링크 매핑 */}
        {NAV_LINKS.map(({ href, label, Icon }) => (
          <NavLink
            key={href}
            href={href}
            label={label}
            Icon={Icon}
            active={pathname === href || pathname.startsWith(href + '/')}
            onClick={closePanel}
          />
        ))}

        {/* 검색, 알림 버튼 */}
        <NavButton label="검색" Icon={Search} active={activePanel === 'search'} onClick={() => activePanel === 'search' ? closePanel() : setActivePanel('search')} />
        <NavButton label="알림" Icon={Bell} active={activePanel === 'notification'} badgeCount={unreadCount} onClick={() => activePanel === 'notification' ? closePanel() : setActivePanel('notification')} />
      </div>

      {/* 하단 설정, 마이페이지 */}
      <div className="flex flex-col items-center gap-3 px-2 w-full">
        <NavLink href="/settings" Icon={Settings} active={pathname === '/settings'} onClick={closePanel} />

        <Link href="/mypage" onClick={closePanel} className="shadow-md hover:shadow-lg transition-shadow rounded-full">
          <Avatar
            src={user?.profileImg ?? undefined}
            initial={user?.nickname?.[0] ?? '?'}
            size="sm"
          />
        </Link>
      </div>
    </nav>
  )
}
