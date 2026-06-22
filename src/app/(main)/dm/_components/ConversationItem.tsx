"use client"

import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { Avatar } from "@/components/common"
import { cn } from "@/lib/utils"
import type { Conversation } from "@/types"

interface Props {
  conversation: Conversation
  isActive?: boolean
  onClick?: () => void
}

export function ConversationItem({ conversation, isActive, onClick }: Props) {
  const { opponent, last_message, unread_count } = conversation

  const preview = last_message
    ? (last_message.content ?? (last_message.img_url ? "사진을 보냈습니다." : ""))
    : "대화를 시작해보세요."

  const timeAgo = last_message?.created_at
    ? formatDistanceToNow(new Date(last_message.created_at), { locale: ko, addSuffix: false })
    : ""

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-bg-subtle text-left",
        isActive && "bg-primary/5 hover:bg-primary/10"
      )}
    >
      <Avatar
        src={opponent.profile_img ?? undefined}
        initial={opponent.nickname[0]?.toUpperCase() ?? "?"}
        size="md"
      />
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className={cn(
            "text-body-sm truncate",
            unread_count > 0 ? "font-bold text-text" : "font-semibold text-text"
          )}>
            {opponent.nickname}
          </span>
          {timeAgo && (
            <span className="text-tiny text-text-muted shrink-0">{timeAgo}</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className={cn(
            "text-caption truncate",
            unread_count > 0 ? "text-text font-medium" : "text-text-muted"
          )}>
            {preview}
          </span>
          {unread_count > 0 && (
            <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-primary text-text-inverse text-tiny font-bold grid place-items-center px-1">
              {unread_count > 99 ? "99+" : unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
