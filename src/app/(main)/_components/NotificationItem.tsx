"use client"

import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { X } from "lucide-react"
import { Avatar } from "@/components/common"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/store/uiStore"
import type { NotificationItem as NotificationItemType } from "@/types"
import {
  useDeleteNotification,
  useMarkNotificationRead,
} from "../_hooks/useNotifications"

interface NotificationItemProps {
  item: NotificationItemType
}

export function NotificationItem({ item }: NotificationItemProps) {
  const router = useRouter()
  const closePanel = useUIStore((s) => s.closePanel)
  const markRead = useMarkNotificationRead()
  const deleteOne = useDeleteNotification()

  const relativeTime = (() => {
    try {
      return formatDistanceToNow(new Date(item.created_at), {
        locale: ko,
        addSuffix: true,
      })
    } catch {
      return ""
    }
  })()

  const handleClick = () => {
    // 읽지 않은 알림이면 읽음 처리 (실패해도 라우팅은 진행)
    if (!item.is_read) {
      markRead.mutate(item.notification_id)
    }

    if (item.target_type === "user") {
      router.push(`/users/${item.target_id}`)
      closePanel()
      return
    }

    if (item.target_type === "post") {
      router.push(`/?solo=${item.target_id}&post=${item.target_id}`)
      closePanel()
      return
    }

    if (item.target_type === "dm") {
      router.push(`/dm/${item.target_id}`)
      closePanel()
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    deleteOne.mutate(item.notification_id)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleClick()
        }
      }}
      data-testid="notification-item"
      data-read={item.is_read}
      className={cn(
        "group relative flex items-center gap-3 px-8 py-3 cursor-pointer transition-colors hover:bg-bg-subtle",
        !item.is_read && "bg-primary/5",
      )}
    >
      <Avatar
        src={item.sender.profile_img || undefined}
        initial={item.sender.nickname[0]?.toUpperCase() ?? "?"}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <p className="text-body-sm text-text">
          <span className="font-semibold">{item.sender.nickname}</span>
          <span className="text-text-muted">
            {item.message.replace(item.sender.nickname, "")}
          </span>
        </p>
        <p className="text-caption text-text-muted mt-0.5">{relativeTime}</p>
      </div>

      {!item.is_read && (
        <span
          aria-hidden
          className="w-2 h-2 rounded-full bg-primary shrink-0"
        />
      )}

      <button
        type="button"
        onClick={handleDelete}
        aria-label="알림 삭제"
        className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 flex items-center justify-center rounded-full text-text-muted hover:text-text hover:bg-bg-card"
      >
        <X size={16} />
      </button>
    </div>
  )
}

export default NotificationItem
