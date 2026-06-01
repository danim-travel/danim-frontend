import React from "react";
import { bgCoverStyle } from "@/lib/utils";
import Avatar from "../../common/Avatar/Avatar";
import Button from "../../common/Button/Button";

export type NotificationType = "follow" | "like" | "comment" | "mention";

export interface NotificationItemProps {
  actor: { name: string; initial: string; color?: string };
  type: NotificationType;
  message: React.ReactNode;
  time: string;
  thumbnail?: string;
  following?: boolean;
  onFollow?: () => void;
}

export function NotificationItem({ actor, type, message, time, thumbnail, following, onFollow }: NotificationItemProps) {
  return (
    <div className="flex items-center gap-3 px-6 py-3">
      <Avatar size="md" initial={actor.initial} color={actor.color} />
      <div className="flex-1 min-w-0 text-[13px] text-text-secondary leading-[1.6]">
        {message}
        <span className="text-text-muted ml-1">{time}</span>
      </div>
      {type === "follow" && (
        <Button variant={following ? "secondary" : "primary"} size="sm" onClick={onFollow}>
          {following ? "팔로잉" : "맞팔로우"}
        </Button>
      )}
      {(type === "like" || type === "comment" || type === "mention") && thumbnail && (
        <div
          className="w-11 h-11 rounded-sm shrink-0"
          style={bgCoverStyle(thumbnail)}
        />
      )}
    </div>
  );
}

export default NotificationItem;
