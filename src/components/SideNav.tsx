'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, PenLine, Search, MessageCircle, Bell, Settings } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'

const NAV_LINKS = [
  { href: '/', label: '홈', Icon: Home },
  { href: '/explore', label: '탐색', Icon: Compass },
  { href: '/write', label: '기록', Icon: PenLine },
  { href: '/dm', label: '메시지', Icon: MessageCircle },
]

export default function SideNav() {
  const pathname = usePathname()
  const { setActivePanel } = useUIStore()
  const user = useAuthStore((s) => s.user)

  return (
    <nav className="w-[68px] bg-bg-card border-r border-border flex flex-col items-center shrink-0 h-full py-4">
      <Link href="/" className="mb-5">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
          <span className="text-text-inverse text-base">✈️</span>
        </div>
      </Link>

      <div className="flex flex-col items-center gap-0.5 flex-1 w-full px-2">
        {NAV_LINKS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-1 w-full py-3 rounded-xl transition-all ${
                active ? 'bg-primary/10' : 'hover:bg-bg-subtle'
              }`}
            >
              <Icon
                className={`w-[22px] h-[22px] ${active ? 'text-primary' : 'text-text-disabled'}`}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className={`text-[9px] font-semibold tracking-wide ${active ? 'text-primary' : 'text-text-disabled'}`}>
                {label}
              </span>
            </Link>
          )
        })}

        <button
          onClick={() => setActivePanel('search')}
          className="flex flex-col items-center justify-center gap-1 w-full py-3 rounded-xl transition-all hover:bg-bg-subtle"
        >
          <Search className="w-[22px] h-[22px] text-text-disabled" strokeWidth={2} />
          <span className="text-[9px] font-semibold tracking-wide text-text-disabled">검색</span>
        </button>

        <button
          onClick={() => setActivePanel('notification')}
          className="flex flex-col items-center justify-center gap-1 w-full py-3 rounded-xl transition-all hover:bg-bg-subtle"
        >
          <Bell className="w-[22px] h-[22px] text-text-disabled" strokeWidth={2} />
          <span className="text-[9px] font-semibold tracking-wide text-text-disabled">알림</span>
        </button>
      </div>

      <div className="flex flex-col items-center gap-3 px-2 w-full">
        <Link
          href="/settings"
          className={`w-full flex items-center justify-center h-10 rounded-xl transition-colors ${
            pathname === '/settings' ? 'bg-primary/10' : 'hover:bg-bg-subtle'
          }`}
        >
          <Settings
            className={`w-5 h-5 ${pathname === '/settings' ? 'text-primary' : 'text-text-disabled'}`}
            strokeWidth={2}
          />
        </Link>

        <Link href="/mypage">
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
    </nav>
  )
}
