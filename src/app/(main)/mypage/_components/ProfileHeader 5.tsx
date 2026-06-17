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

  if (href) {
    return (
      <Link href={href} className="flex flex-col items-center bg-bg rounded-xl px-4 py-3 w-[120px] md:w-[160px] hover:bg-bg-subtle transition-colors">
        {content}
      </Link>
    );
  }

  return (
    <div className="flex flex-col items-center bg-bg rounded-xl px-4 py-3 w-[120px] md:w-[160px]">
      {content}
    </div>
  );
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const initial = profile.nickname?.slice(0, 1).toUpperCase() ?? "?";

  return (
    <section className="relative bg-bg-card rounded-2xl p-5 md:p-6">
      {/* 모바일 전용 설정 버튼 */}
      <Link
        href="/settings"
        className="absolute top-4 right-4 md:hidden w-8 h-8 flex items-center justify-center rounded-xl hover:bg-bg-subtle transition-colors"
        aria-label="설정"
      >
        <Settings className="w-5 h-5 text-text-muted" strokeWidth={2} />
      </Link>

      <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
        <Avatar size="xl" src={profile.profile_img || undefined} initial={initial} />

        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-text">{profile.nickname}</h2>
          {profile.name && (
            <p className="text-xs text-text-muted mt-0.5">{profile.name}</p>
          )}
          {profile.intro && (
            <p className="text-sm text-text-muted mt-1 whitespace-pre-wrap">
              {profile.intro}
            </p>
          )}

          <div className="flex gap-3 mt-4">
            <StatItem label="팔로워" value={profile.follower} href="/followers?tab=followers" />
            <StatItem label="팔로잉" value={profile.following} href="/followers?tab=following" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProfileHeader;
