"use client";
import Link from "next/link";
import { Settings } from "lucide-react";
import { Avatar } from "@/components/common";
import type { UserProfileResponse } from "@/types";

export interface ProfileHeaderProps {
  profile: UserProfileResponse;
}

interface StatItemProps {
  label: string;
  value: number;
  href?: string;
}

function formatCount(n: number): string {
  if (n < 1000) return String(n);
  const compact = (value: number, unit: string) => {
    const formatted = value.toFixed(1).replace(/\.0$/, "");
    return `${formatted}${unit}`;
  };
  if (n < 1_000_000) return compact(n / 1_000, "K");
  if (n < 1_000_000_000) return compact(n / 1_000_000, "M");
  return compact(n / 1_000_000_000, "B");
}

function StatItem({ label, value, href }: StatItemProps) {
  const content = (
    <>
      <div className="text-xl font-bold text-text">{formatCount(value)}</div>
      <div className="text-xs text-text-muted mt-1">{label}</div>
    </>
  );

  const cls = "flex flex-col items-center bg-bg rounded-xl px-3 py-2 flex-1 md:flex-none md:px-4 md:py-3 md:w-[160px]";

  if (href) {
    return (
      <Link href={href} className={`${cls} hover:bg-bg-subtle transition-colors`}>
        {content}
      </Link>
    );
  }

  return (
    <div className={cls}>
      {content}
    </div>
  );
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const initial = profile.nickname?.slice(0, 1).toUpperCase() ?? "?";

  return (
    <section className="relative bg-bg-card rounded-2xl p-5 md:p-6">
      {/* 아바타 + (모바일: 스탯 | 데스크톱: 텍스트+스탯) */}
      <div className="flex items-center gap-4 md:items-start md:gap-6">
        {/* 아바타 + 우하단 설정 버튼 */}
        <div className="relative shrink-0">
          <Avatar size="xl" src={profile.profile_img || undefined} initial={initial} />
          <Link
            href="/settings"
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-bg-card border border-border flex items-center justify-center shadow-sm hover:bg-bg-subtle transition-colors"
            aria-label="설정"
          >
            <Settings className="w-3.5 h-3.5 text-text-muted" strokeWidth={2} />
          </Link>
        </div>

        <div className="flex-1 min-w-0">
          {/* 데스크톱: 닉네임/소개 */}
          <div className="hidden md:block">
            <h2 className="text-lg font-bold text-text truncate">{profile.nickname}</h2>
            {profile.name && <p className="text-xs text-text-muted mt-0.5 truncate">{profile.name}</p>}
            {profile.intro && (
              <p className="text-sm text-text-muted mt-1 whitespace-pre-wrap">{profile.intro}</p>
            )}
          </div>
          {/* 스탯: 모바일→아바타 옆, 데스크톱→텍스트 아래 */}
          <div className="flex gap-2 md:gap-3 md:mt-4">
            <StatItem label="팔로워" value={profile.follower} href="/followers?tab=followers" />
            <StatItem label="팔로잉" value={profile.following} href="/followers?tab=following" />
          </div>
        </div>
      </div>

      {/* 모바일: 닉네임/소개 (아바타+스탯 아래) */}
      <div className="mt-3 md:hidden">
        <h2 className="text-lg font-bold text-text truncate">{profile.nickname}</h2>
        {profile.name && <p className="text-xs text-text-muted mt-0.5 truncate">{profile.name}</p>}
        {profile.intro && (
          <p className="text-sm text-text-muted mt-1 whitespace-pre-wrap">{profile.intro}</p>
        )}
      </div>
    </section>
  );
}

export default ProfileHeader;
