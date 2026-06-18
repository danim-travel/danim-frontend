"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { Avatar, IconButton } from "@/components/common"
import type { UserBrief } from "@/types"

interface Props {
  opponent: UserBrief
}

export function ChatHeader({ opponent }: Props) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-2 px-3 h-14 border-b border-border shrink-0">
      <IconButton
        icon={<ChevronLeft size={20} />}
        aria-label="뒤로가기"
        size="sm"
        className="md:hidden"
        onClick={() => router.push("/dm")}
      />
      <Avatar
        src={opponent.profile_img ?? undefined}
        initial={opponent.nickname[0]?.toUpperCase() ?? "?"}
        size="sm"
      />
      <span className="text-card-title font-bold text-text">{opponent.nickname}</span>
    </div>
  )
}
