import React from "react";
import { cn } from "@/lib/utils";
import Avatar from "../../common/Avatar/Avatar";
import Button from "../../common/Button/Button";

export interface UserCardProps {
  user: { name: string; handle: string; region?: string; bio?: string; initial: string; color?: string; verified?: boolean; mutual?: boolean; };
  following?: boolean;
  layout?: "row" | "card";
  onToggleFollow?: () => void;
}

export function UserCard({ user, following, layout = "row", onToggleFollow }: UserCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4",
        layout === "row" ? "px-6 py-5 bg-transparent" : "p-6 bg-bg-card rounded-card shadow-card"
      )}
    >
      <Avatar size="lg" initial={user.initial} color={user.color} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[16px] font-bold text-text">{user.name}</span>
          {user.mutual && (
            <span className="text-[12px] px-2 rounded-pill bg-primary-soft text-primary-active">맞팔</span>
          )}
        </div>
        <div className="text-[12px] text-text-muted">
          {user.handle}{user.region ? ` · ${user.region}` : ""}
        </div>
        {user.bio && <div className="text-[13px] text-text-secondary mt-1">{user.bio}</div>}
      </div>
      <Button
        variant={following ? "primary" : "outline"}
        size="sm"
        onClick={() => onToggleFollow?.()}
        className="rounded-pill min-w-[96px]"
      >
        {following ? "팔로잉" : user.mutual ? "맞팔로우" : "팔로우"}
      </Button>
    </div>
  );
}

export default UserCard;
