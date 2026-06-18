"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { PenSquare } from "lucide-react"
import { Avatar, IconButton } from "@/components/common"
import { useAuthStore } from "@/store/authStore"
import { cn } from "@/lib/utils"
import { ConversationList } from "./_components/ConversationList"
import { NewConversationModal } from "./_components/NewConversationModal"

interface Props {
  children: React.ReactNode
}

export default function DmLayout({ children }: Props) {
  const pathname = usePathname()
  const user = useAuthStore(s => s.user)
  const [modalOpen, setModalOpen] = useState(false)

  const match = pathname.match(/^\/dm\/(.+)$/)
  const isInRoom = !!match
  const roomId = match?.[1]

  return (
    <div className="h-full flex bg-bg-card overflow-hidden">
      {/* 좌측: 대화 목록 패널 */}
      <aside className={cn(
        "flex flex-col shrink-0 border-r border-border",
        "w-full md:w-(--panel-width)",
        isInRoom ? "hidden md:flex" : "flex"
      )}>
        {/* 패널 헤더 */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {user && (
              <Avatar
                src={user.profileImg ?? undefined}
                initial={user.nickname[0]?.toUpperCase() ?? "?"}
                size="sm"
              />
            )}
            <span className="text-card-title font-bold text-text truncate">
              {user?.nickname}
            </span>
          </div>
          <IconButton
            icon={<PenSquare size={18} />}
            aria-label="새 대화"
            size="sm"
            onClick={() => setModalOpen(true)}
          />
        </div>

        <ConversationList activeConversationId={roomId} />
      </aside>

      {/* 우측: 채팅 영역 */}
      <main className={cn(
        "flex-1 min-w-0 flex flex-col",
        isInRoom ? "flex" : "hidden md:flex"
      )}>
        {children}
      </main>

      <NewConversationModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
