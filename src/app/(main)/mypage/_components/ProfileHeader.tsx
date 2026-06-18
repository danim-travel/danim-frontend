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
      <div className="text-sm font-bold text-text leading-tight sm:text-lg md:text-xl">{formatCount(value)}</div>
      <div className="text-[10px] text-text-muted sm:text-xs sm:mt-2 md:text-xs md:mt-1">{label}</div>
    </>
  );

  // <640px(모바일): 가변(flex-1) — 폰 뷰포트 차이 대응
  // 640~768px(태블릿): w-36 (144px) — 충분히 큰 고정 너비
  // ≥768px(데스크탑): w-[160px]
  const cls = "flex flex-col items-center bg-bg rounded-md px-2 py-1.5 flex-1 min-w-0 sm:rounded-lg sm:px-4 sm:py-2.5 sm:flex-none sm:w-36 md:rounded-xl md:px-4 md:py-3 md:w-[160px]";

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
    <section className="relative bg-bg-card rounded-2xl p-5 md:flex md:items-start md:gap-6 md:p-6">
      {/* 모바일: 아바타 옆에 스탯을 배치 */}
      <div className="flex items-center gap-4 md:contents">
        {/* 아바타 + 우하단 설정 버튼 */}
        <div className="relative shrink-0">
          <Avatar size="xl" src={profile.profile_img || undefined} initial={initial} />
          <Link
            href="/settings"
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-bg-card border border-border flex items-center justify-center shadow-sm hover:bg-bg-subtle transition-colors md:hidden"
            aria-label="설정"
          >
            <Settings className="w-3.5 h-3.5 text-text-muted" strokeWidth={2} />
          </Link>
        </div>

        <div className="flex-1 min-w-0">
          {/* 데스크톱: 수정 전 웹 레이아웃처럼 소개 영역과 스탯을 분리 */}
          <div className="hidden md:block">
            <h2 className="text-lg font-bold text-text">{profile.nickname}</h2>
            {profile.name && <p className="text-xs text-text-muted mt-2">{profile.name}</p>}
            {profile.intro && (
              <p className="text-sm text-text-muted mt-1 whitespace-pre-wrap">{profile.intro}</p>
            )}
          </div>
          <div className="flex gap-2 sm:justify-end md:hidden">
            <StatItem label="팔로워" value={profile.follower} href="/followers?tab=followers" />
            <StatItem label="팔로잉" value={profile.following} href="/followers?tab=following" />
          </div>
        </div>
      </div>

      <div className="hidden md:flex md:flex-col md:items-end md:gap-3 md:shrink-0">
        <div className="flex gap-6">
          <StatItem label="팔로워" value={profile.follower} href="/followers?tab=followers" />
          <StatItem label="팔로잉" value={profile.following} href="/followers?tab=following" />
        </div>
      </div>

      {/* 모바일: 닉네임/소개 */}
      <div className="mt-3 md:hidden">
        <h2 className="text-lg font-bold text-text truncate">{profile.nickname}</h2>
        {profile.name && <p className="text-xs text-text-muted mt-2 truncate">{profile.name}</p>}
        {profile.intro && (
          <p className="text-sm text-text-muted mt-1 whitespace-pre-wrap">{profile.intro}</p>
        )}
      </div>
    </section>
  );
}

export default ProfileHeader;
