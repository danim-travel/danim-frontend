"use client";

import { memo } from "react";
import { Avatar } from "@/components/common";

interface FeedCardHeaderProps {
  nickname: string;
  profileImg: string | null;
  region: string;
  variant?: "panel" | "sheet";
}

function FeedCardHeaderBase({ nickname, profileImg, region, variant = "panel" }: FeedCardHeaderProps) {
  return (
    <div className={variant === "sheet" ? "flex items-center gap-2 min-w-0" : "flex items-center gap-3"}>
      <Avatar size="sm" src={profileImg ?? undefined} initial={nickname.charAt(0)} />
      <div className="flex flex-col min-w-0">
        <span className="font-bold text-base truncate">{nickname}</span>
        {region && (
          <span
            className={
              variant === "sheet"
                ? "text-caption text-text-muted truncate"
                : "text-body-sm text-text-muted"
            }
          >
            {region}
          </span>
        )}
      </div>
    </div>
  );
}

export const FeedCardHeader = memo(FeedCardHeaderBase);
