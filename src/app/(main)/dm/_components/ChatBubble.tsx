import { Avatar } from "@/components/common"
import { cn } from "@/lib/utils"
import type { Message, UserBrief } from "@/types"

interface Props {
  message: Message
  isMine: boolean
  /** 연속된 메시지 중 마지막 메시지일 때 아바타를 표시한다 */
  showAvatar: boolean
  opponent: UserBrief
}

export function ChatBubble({ message, isMine, showAvatar, opponent }: Props) {
  if (message.is_deleted) {
    return (
      <div className={cn("flex gap-2 items-end", isMine ? "justify-end" : "justify-start")}>
        {!isMine && <div className="w-8 shrink-0" />}
        <span className="px-3 py-2 text-body-sm text-text-muted border border-border rounded-pill italic">
          삭제된 메시지입니다.
        </span>
      </div>
    )
  }

  return (
    <div className={cn("flex gap-2 items-end", isMine ? "justify-end" : "justify-start")}>
      {/* 상대방 아바타 — 연속 메시지 중 마지막에만 표시 */}
      {!isMine && (
        <div className="w-8 shrink-0 self-end pb-1">
          {showAvatar && (
            <Avatar
              src={opponent.profile_img ?? undefined}
              initial={opponent.nickname[0]?.toUpperCase() ?? "?"}
              size="sm"
            />
          )}
        </div>
      )}

      <div className={cn("flex flex-col gap-1 max-w-[70%]", isMine ? "items-end" : "items-start")}>
        {message.img_url && (
          <div className="rounded-card overflow-hidden bg-bg-subtle">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.img_url}
              alt="이미지"
              className="max-w-[240px] max-h-[240px] w-full object-cover block"
            />
          </div>
        )}
        {message.content && (
          <div
            className={cn(
              "px-4 py-2.5 text-body-sm break-all whitespace-pre-wrap",
              isMine
                ? "bg-primary text-text-inverse rounded-[18px] rounded-br-[4px]"
                : "bg-bg-subtle text-text rounded-[18px] rounded-bl-[4px]"
            )}
          >
            {message.content}
          </div>
        )}
      </div>
    </div>
  )
}
