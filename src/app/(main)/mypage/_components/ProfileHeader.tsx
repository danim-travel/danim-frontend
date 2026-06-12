"use client";
import Link from "next/link";
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
      <Link href={href} className="flex flex-col items-center bg-bg rounded-xl px-4 py-3 w-[160px] hover:bg-bg-subtle transition-colors">
        {content}
      </Link>
    );
  }

  return (
    <div className="flex flex-col items-center bg-bg rounded-xl px-4 py-3 w-[160px]">
      {content}
    </div>
  );
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const initial = profile.nickname?.slice(0, 1).toUpperCase() ?? "?";

  return (
    <section className="flex items-start gap-6 bg-bg-card rounded-2xl p-6">
      <Avatar
        size="xl"
        src={profile.profile_img || undefined}
        initial={initial}
      />

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
      </div>

      <div className="flex flex-col items-end gap-3 shrink-0">
        <div className="flex gap-6">
          <StatItem label="팔로워" value={profile.follower} href="/followers?tab=followers" />
          <StatItem label="팔로잉" value={profile.following} href="/followers?tab=following" />
        </div>

      </div>
    </section>
  );
}

export default ProfileHeader;
