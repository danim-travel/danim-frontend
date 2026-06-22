"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Avatar } from "@/components/common";
import { ProfileStat } from "@/components/profile";
import { TRAVEL_PHRASES, type TravelPhrase } from "@/lib/travelPhrases";
import type { UserProfileResponse } from "@/types";

export interface ProfileHeaderProps {
  profile: UserProfileResponse;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const router = useRouter();
  const initial = profile.nickname?.slice(0, 1).toUpperCase() ?? "?";
  const intro = profile.intro?.trim();

  const [phrase] = useState<TravelPhrase>(
    () => TRAVEL_PHRASES[Math.floor(Math.random() * TRAVEL_PHRASES.length)],
  );

  const avatarEditButton = (
    <button
      onClick={() => router.push("/settings")}
      className="absolute -bottom-1 -right-1 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-bg-card shadow-sm hover:bg-bg-subtle transition-colors"
      aria-label="프로필 사진 편집"
    >
      <Pencil size={13} className="text-text-secondary" />
    </button>
  );

  const characterImage = (size: number, mobileBottom?: boolean) => (
    <div className={`relative shrink-0 ${mobileBottom ? "h-[74px] w-14" : "h-[68px] w-[68px]"}`}>
      <Image
        src={phrase.characterSrc}
        alt=""
        fill
        className={`object-contain ${mobileBottom ? "object-bottom" : ""}`}
        sizes={`${size}px`}
      />
    </div>
  );

  return (
    <section className="rounded-card border border-border bg-bg-card p-5 md:p-6">
      {/* ── 데스크톱 ── */}
      <div className="hidden md:flex md:items-center md:gap-6">
        {/* 아바타 + 편집 버튼 */}
        <div className="relative shrink-0">
          <Avatar
            size="xl"
            className="h-[88px] w-[88px]"
            src={profile.profile_img || undefined}
            initial={initial}
          />
          {avatarEditButton}
        </div>

        {/* 닉네임 / 여행 멘트 / 캐릭터 / 소개 */}
        <div className="flex-1 min-w-0">
          {/* 닉네임 + 여행 멘트 + 캐릭터 — 하나의 그룹 */}
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <p className="text-card-title font-bold text-text truncate">
                {profile.nickname} 님,
              </p>
              <p className="mt-1 text-card-title font-bold text-primary">
                {phrase.phrase}
              </p>
            </div>
            {characterImage(68)}
          </div>
          {intro && (
            <p className="mt-2 text-body-sm text-text-secondary whitespace-pre-wrap">
              {intro}{" "}
              <button
                onClick={() => router.push("/settings")}
                className="inline-flex items-center align-text-bottom hover:opacity-60 transition-opacity"
                aria-label="소개 편집"
              >
                <Pencil size={12} className="text-text-muted" />
              </button>
            </p>
          )}
        </div>

        {/* 통계 */}
        <div className="flex shrink-0 items-center divide-x divide-border">
          <ProfileStat variant="divider" label="게시글" value={profile.posts_count} />
          <ProfileStat
            variant="divider"
            label="팔로워"
            value={profile.follower}
            href="/followers?tab=followers"
          />
          <ProfileStat
            variant="divider"
            label="팔로잉"
            value={profile.following}
            href="/followers?tab=following"
          />
        </div>
      </div>

      {/* ── 모바일 ── */}
      <div className="md:hidden">
        {/* 아바타 + 통계 행 */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <Avatar
              size="xl"
              className="h-[72px] w-[72px]"
              src={profile.profile_img || undefined}
              initial={initial}
            />
            {avatarEditButton}
          </div>
          <div className="flex flex-1 items-stretch divide-x divide-border">
            <ProfileStat variant="inline" label="게시글" value={profile.posts_count} />
            <ProfileStat
              variant="inline"
              label="팔로워"
              value={profile.follower}
              href="/followers?tab=followers"
            />
            <ProfileStat
              variant="inline"
              label="팔로잉"
              value={profile.following}
              href="/followers?tab=following"
            />
          </div>
        </div>

        {/* 닉네임 + 캐릭터 이미지 — 하나의 그룹 */}
        <div className="mt-2 flex items-end gap-3">
          <div className="min-w-0">
            <p className="text-card-title font-bold text-text">
              {profile.nickname} 님,
            </p>
            <p className="mt-1 text-card-title font-bold text-primary">
              {phrase.phrase}
            </p>
          </div>
          {characterImage(56, true)}
        </div>

        {/* 소개 + 편집 아이콘 — 소개 없으면 렌더링 안 함 */}
        {intro && (
          <>
            <hr className="my-3 border-border" />
            <p className="text-body-sm text-text-secondary whitespace-pre-wrap">
              {intro}{" "}
              <button
                onClick={() => router.push("/settings")}
                className="inline-flex items-center align-text-bottom hover:opacity-60 transition-opacity"
                aria-label="소개 편집"
              >
                <Pencil size={12} className="text-text-muted" />
              </button>
            </p>
          </>
        )}
      </div>
    </section>
  );
}

export default ProfileHeader;
