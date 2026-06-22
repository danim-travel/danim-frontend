"use client"

import Link from "next/link"
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
      <Link href={`/users/${opponent.user_id}`} className="flex items-center gap-2 min-w-0">
        <Avatar
          src={opponent.profile_img ?? undefined}
          initial={opponent.nickname[0]?.toUpperCase() ?? "?"}
          size="sm"
        />
        <span className="text-card-title font-bold text-text truncate">{opponent.nickname}</span>
      </Link>
    </div>
  )
}
