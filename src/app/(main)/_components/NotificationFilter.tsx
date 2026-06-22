"use client"

import { Badge } from "@/components/common"
import type { NotificationType } from "@/types"

export type NotificationFilterValue = NotificationType | "all"

interface NotificationFilterProps {
  value: NotificationFilterValue
  onChange: (value: NotificationFilterValue) => void
}

const FILTERS: { key: NotificationFilterValue; label: string }[] = [
  { key: "all", label: "모두" },
  { key: "follow", label: "팔로우" },
  { key: "comment", label: "댓글" },
  { key: "comment_like", label: "댓글좋아요" },
  { key: "post_like", label: "게시글좋아요" },
  { key: "dm", label: "DM" },
]

export function NotificationFilter({ value, onChange }: NotificationFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 md:px-8 pb-3 scrollbar-none">
      {FILTERS.map(({ key, label }) => (
        <Badge
          key={key}
          variant="filter"
          selected={value === key}
          onClick={() => onChange(key)}
          className="shrink-0"
        >
          {label}
        </Badge>
      ))}
    </div>
  )
}

export default NotificationFilter
