"use client";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronDown, Pencil } from "lucide-react";
import { Avatar } from "@/components/common";
import { ProfileStat } from "@/components/profile";
import { TRAVEL_PHRASES, type TravelPhrase } from "@/lib/travelPhrases";
import type { UserProfileResponse } from "@/types";

export interface ProfileHeaderProps {
  profile: UserProfileResponse;
}

const INTRO_CLAMP_LINES = 3;
const OVERFLOW_TOLERANCE_PX = 1;

function IntroText({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [maxHeight, setMaxHeight] = useState<number | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
      const clampedHeight = lineHeight * INTRO_CLAMP_LINES;
      setMaxHeight(clampedHeight);
      setIsOverflowing(el.scrollHeight > clampedHeight + OVERFLOW_TOLERANCE_PX);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = 0;
    setIsAtBottom(el.scrollHeight <= el.clientHeight + OVERFLOW_TOLERANCE_PX);
  }, [expanded]);

  const handleScroll = (e: React.UIEvent<HTMLParagraphElement>) => {
    const el = e.currentTarget;
    setIsAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - OVERFLOW_TOLERANCE_PX);
  };

  return (
    <div className="relative">
      <p
        ref={ref}
        onScroll={handleScroll}
        style={maxHeight ? { maxHeight } : undefined}
        className={`text-body-sm text-text-secondary whitespace-pre-wrap ${
          expanded ? "overflow-y-auto scrollbar-none" : "overflow-hidden"
        }`}
      >
        {text}
      </p>

      {isOverflowing && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="absolute bottom-0 right-0 pl-10 text-caption font-medium text-primary hover:text-primary/70 transition-colors bg-gradient-to-l from-bg-card from-50% to-transparent"
        >
          더 보기
        </button>
      )}

      {expanded && !isAtBottom && (
        <div className="absolute bottom-0 left-0 right-0 h-7 flex items-end justify-center pb-0.5 bg-gradient-to-t from-bg-card to-transparent pointer-events-none">
          <ChevronDown size={14} className="text-text-muted" />
        </div>
      )}
    </div>
  );
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
        <div className="relative shrink-0">
          <Avatar
            size="xl"
            className="h-[88px] w-[88px]"
            src={profile.profile_img || undefined}
            initial={initial}
          />
          {avatarEditButton}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <p className="text-card-title font-bold text-text truncate">
                {profile.nickname} 님,
              </p>
              <p className="mt-1 text-card-title font-bold text-primary break-keep">
                {phrase.phrase}
              </p>
            </div>
            {characterImage(68)}
          </div>
          {intro && (
            <div className="mt-2">
              <IntroText text={intro} />
            </div>
          )}
        </div>

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

        {intro && (
          <>
            <hr className="my-3 border-border" />
            <IntroText text={intro} />
          </>
        )}
      </div>
    </section>
  );
}

export default ProfileHeader;
