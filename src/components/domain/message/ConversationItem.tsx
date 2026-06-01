import React from "react";
import { cn } from "@/lib/utils";
import Avatar from "../../common/Avatar/Avatar";

export interface ConversationItemProps {
  user: { name: string; initial: string; color?: string };
  preview: string;
  time?: string;
  unread?: boolean;
  online?: boolean;
  active?: boolean;
  onClick?: () => void;
}

export function ConversationItem({ user, preview, time, unread, online, active, onClick }: ConversationItemProps) {
  return (
    <button
      onClick={onClick}
      data-state={active ? "active" : "default"}
      className={cn(
        "flex items-center gap-3 w-full text-left px-6 py-3 border-none cursor-pointer",
        active ? "bg-primary-soft" : "bg-transparent"
      )}
    >
      <span className="relative shrink-0">
        <Avatar size="lg" initial={user.initial} color={user.color} />
        {online && <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-bg-card" />}
      </span>
      <div className="flex-1 min-w-0">
        <div className={cn("text-[16px] text-text", unread ? "font-bold" : "font-semibold")}>
          {user.name}
        </div>
        <div className={cn("text-[13px] truncate", unread ? "text-text-secondary" : "text-text-muted")}>
          {preview}{time ? ` · ${time}` : ""}
        </div>
      </div>
    </button>
  );
}

export default ConversationItem;
