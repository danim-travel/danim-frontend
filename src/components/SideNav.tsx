"use client";

import { useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, PenLine, Search, MessageCircle, Bell, Settings, type LucideIcon } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useOnClickOutside } from '@/hooks/useOnClickOutside'
import { LogoutModal } from '@/components/common'

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
}

function NavButton({ label, Icon, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 w-full py-3 rounded-xl transition-all hover:bg-bg-subtle"
    >
      <Icon className="w-(--icon-size-lg) h-(--icon-size-lg) text-text-disabled" strokeWidth={2} />
      <span className="text-nav font-semibold tracking-wide text-text-disabled whitespace-nowrap">{label}</span>
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
      <Icon className={`w-(--icon-size-lg) h-(--icon-size-lg) ${active ? 'text-primary' : 'text-text-disabled'}`} strokeWidth={active ? 2.5 : 2} />
      {label && <span className={`text-nav font-semibold tracking-wide whitespace-nowrap ${active ? 'text-primary' : 'text-text-disabled'}`}>{label}</span>}
    </Link>
  )
}

export default function SideNav() {
  const pathname = usePathname()
  const { activePanel, setActivePanel, closePanel } = useUIStore()
  const user = useAuthStore((s) => s.user)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [logoutModal, setLogoutModal] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)

  useOnClickOutside(settingsRef, () => setSettingsOpen(false), settingsOpen)

  const isSettingsActive = pathname === '/settings'

  return (
    <nav className="w-(--sidebar-width) bg-bg-card border-r border-border flex flex-col items-center shrink-0 h-full py-4">
      {/* 메인 로고, 클릭하면 홈으로 이동 */}
      <Link href="/" onClick={closePanel} className="mb-5">
        <img src="/favicon.svg" alt="Danim" className="w-10 h-10 rounded-lg shadow-md hover:shadow-lg transition-shadow" />
      </Link>

      {/* 메인 네비게이션 링크 */}
      <div className="flex flex-col items-center gap-0.5 flex-1 w-full px-2">
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
        <NavButton label="검색" Icon={Search} onClick={() => activePanel === 'search' ? closePanel() : setActivePanel('search')} />
        <NavButton label="알림" Icon={Bell} onClick={() => activePanel === 'notification' ? closePanel() : setActivePanel('notification')} />
      </div>

      {/* 하단 설정, 마이페이지 */}
      <div className="flex flex-col items-center gap-3 px-2 w-full">
        {/* 설정 버튼 — 클릭 시 드롭다운 */}
        <div ref={settingsRef} className="relative w-full">
          <button
            type="button"
            onClick={() => setSettingsOpen(o => !o)}
            className={`flex flex-col items-center justify-center gap-1 w-full py-3 rounded-xl transition-all ${isSettingsActive ? 'bg-primary/10' : 'hover:bg-bg-subtle'}`}
          >
            <Settings
              className={`w-(--icon-size-lg) h-(--icon-size-lg) ${isSettingsActive ? 'text-primary' : 'text-text-disabled'}`}
              strokeWidth={isSettingsActive ? 2.5 : 2}
            />
          </button>

          {settingsOpen && (
            <div className="absolute bottom-0 left-full ml-2 bg-bg-card border border-border rounded-card shadow-modal min-w-[140px] py-1 z-(--z-drawer)">
              <Link
                href="/settings"
                onClick={() => { setSettingsOpen(false); closePanel() }}
                className="flex px-4 py-2.5 text-body-sm text-text hover:bg-bg-subtle transition-colors"
              >
                내 정보 수정
              </Link>
              <button
                type="button"
                onClick={() => { setSettingsOpen(false); setLogoutModal(true) }}
                className="w-full text-left px-4 py-2.5 text-body-sm text-error hover:bg-bg-subtle transition-colors"
              >
                로그아웃
              </button>
            </div>
          )}
        </div>

        <Link href="/mypage" onClick={closePanel}>
          {user?.profileImg ? (
            <img
              src={user.profileImg}
              alt="프로필"
              className="w-9 h-9 rounded-full object-cover shadow-md hover:shadow-lg transition-shadow"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-border shadow-md hover:shadow-lg transition-shadow" />
          )}
        </Link>
      </div>

      <LogoutModal open={logoutModal} onClose={() => setLogoutModal(false)} />
    </nav>
  )
}
