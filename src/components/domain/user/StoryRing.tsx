import React from "react";
import { cn } from "@/lib/utils";
import Avatar from "../../common/Avatar/Avatar";

export interface StoryRingProps { user: { name: string; initial: string; color?: string }; seen?: boolean; isMemo?: boolean; }

export function StoryRing({ user, seen, isMemo }: StoryRingProps) {
  return (
    <div className="w-16 flex flex-col items-center gap-1">
      <div className={cn("p-[2.5px] rounded-full", seen ? "bg-border" : "bg-[var(--avatar-story-border)]")}>
        <div className="p-0.5 rounded-full bg-bg-card">
          <Avatar size="md" initial={user.initial} color={user.color} />
        </div>
      </div>
      <span className="text-[12px] text-text-secondary max-w-[64px] truncate">
        {isMemo ? "내 메모" : user.name}
      </span>
    </div>
  );
}

export default StoryRing;
