"use client";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, Button } from "@/components/common";
import { ProfileStat } from "@/components/profile";
import { followUser, unfollowUser } from "@/lib/api/users";
import { queryKeys } from "@/lib/queryKeys";
import { getApiErrorMessage } from "@/lib/apiError";
import { toast } from "@/store/toastStore";
import { useDelayedPending } from "@/hooks/ui/useDelayedPending";
import { useAuthStore } from "@/store/authStore";
import type { UserProfileResponse } from "@/types";

interface UserProfileHeaderProps {
  profile: UserProfileResponse;
  userId: string;
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

export default function UserProfileHeader({ profile, userId }: UserProfileHeaderProps) {
  const queryClient = useQueryClient();
  const myUserId = useAuthStore((s) => s.user?.userId);
  const [isFollowing, setIsFollowing] = useState(profile.is_following);
  const [followerCount, setFollowerCount] = useState(profile.follower);
  const initial = profile.nickname?.slice(0, 1).toUpperCase() ?? "?";
  const intro = profile.intro?.trim();

  const { mutate: toggleFollow, isPending } = useMutation({
    mutationFn: (shouldFollow: boolean) =>
      shouldFollow ? followUser(userId) : unfollowUser(userId),
    onMutate: (shouldFollow) => {
      const wasFollowing = isFollowing;
      setIsFollowing(shouldFollow);
      setFollowerCount((prev) => (shouldFollow ? prev + 1 : prev - 1));
      return { wasFollowing };
    },
    onSuccess: (res) => {
      setIsFollowing(res.is_followed);
      setFollowerCount(res.follower_count);
      queryClient.invalidateQueries({ queryKey: queryKeys.users.profile(userId) });
      if (myUserId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.users.profile(myUserId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.mainFeed });
    },
    onError: (err, _, context) => {
      const wasFollowing = context?.wasFollowing ?? isFollowing;
      setIsFollowing(wasFollowing);
      setFollowerCount((prev) => (wasFollowing ? prev + 1 : prev - 1));
      toast.error(getApiErrorMessage(err, { client: "요청에 실패했습니다." }));
    },
  });

  const showLoading = useDelayedPending(isPending);

  return (
    <section className="rounded-card border border-border bg-bg-card p-5 md:p-6">
      {/* ── 데스크톱 ── */}
      <div className="hidden md:flex md:items-center md:gap-6">
        <Avatar
          size="xl"
          className="h-[88px] w-[88px] shrink-0"
          src={profile.profile_img || undefined}
          initial={initial}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-card-title font-bold text-text truncate min-w-0">
              {profile.nickname}
            </h2>
            <Button
              variant={isFollowing ? "primary" : "outline"}
              size="sm"
              className="w-24 shrink-0"
              leftIcon={isFollowing ? <Check size={14} /> : undefined}
              onClick={() => toggleFollow(!isFollowing)}
              loading={showLoading}
              disabled={isPending}
            >
              {isFollowing ? "팔로잉" : "팔로우"}
            </Button>
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
            value={followerCount}
            href={`/followers?tab=followers&userId=${userId}`}
          />
          <ProfileStat
            variant="divider"
            label="팔로잉"
            value={profile.following}
            href={`/followers?tab=following&userId=${userId}`}
          />
        </div>
      </div>

      {/* ── 모바일 ── */}
      <div className="md:hidden">
        {/* 아바타 + 닉네임·통계 — 아바타 높이와 우측 높이를 맞춤 */}
        <div className="flex gap-4">
          <Avatar
            size="xl"
            className="h-[72px] w-[72px] shrink-0"
            src={profile.profile_img || undefined}
            initial={initial}
          />
          <div className="flex flex-col justify-center gap-2 flex-1 min-w-0 h-[72px]">
            <h2 className="text-card-title font-bold text-text truncate">
              {profile.nickname}
            </h2>
            <div className="flex items-stretch divide-x divide-border">
              <ProfileStat variant="compact" label="게시글" value={profile.posts_count} />
              <ProfileStat
                variant="compact"
                label="팔로워"
                value={followerCount}
                href={`/followers?tab=followers&userId=${userId}`}
              />
              <ProfileStat
                variant="compact"
                label="팔로잉"
                value={profile.following}
                href={`/followers?tab=following&userId=${userId}`}
              />
            </div>
          </div>
        </div>

        {/* 팔로우 버튼 — intro 위에 전체 너비 */}
        <Button
          variant={isFollowing ? "primary" : "outline"}
          size="sm"
          className="w-full mt-4"
          leftIcon={isFollowing ? <Check size={14} /> : undefined}
          onClick={() => toggleFollow(!isFollowing)}
          loading={showLoading}
          disabled={isPending}
        >
          {isFollowing ? "팔로잉" : "팔로우"}
        </Button>

        {intro && (
          <>
            <hr className="my-4 border-border" />
            <IntroText text={intro} />
          </>
        )}
      </div>
    </section>
  );
}
