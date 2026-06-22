"use client";
import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, Button } from "@/components/common";
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

interface StatItemProps {
  label: string;
  value: number;
  href: string;
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

// ProfileHeader(마이페이지)와 완전히 동일한 스탯 카드 스타일
function StatItem({ label, value, href }: StatItemProps) {
  const content = (
    <>
      <div className="text-sm font-bold text-text leading-tight sm:text-lg md:text-xl">{formatCount(value)}</div>
      <div className="text-[10px] text-text-muted sm:text-xs sm:mt-2 md:text-xs md:mt-1">{label}</div>
    </>
  );
  const cls = "flex flex-col items-center bg-bg rounded-md px-2 py-1.5 flex-1 min-w-0 sm:rounded-lg sm:px-4 sm:py-2.5 sm:flex-none sm:w-36 md:rounded-xl md:px-4 md:py-3 md:w-[160px]";
  return (
    <Link href={href} className={`${cls} hover:bg-bg-subtle transition-colors`}>
      {content}
    </Link>
  );
}

export default function UserProfileHeader({ profile, userId }: UserProfileHeaderProps) {
  const queryClient = useQueryClient();
  const myUserId = useAuthStore((s) => s.user?.userId);
  const [isFollowing, setIsFollowing] = useState(profile.is_following);
  const [followerCount, setFollowerCount] = useState(profile.follower);
  const initial = profile.nickname?.slice(0, 1).toUpperCase() ?? "?";

  const { mutate: toggleFollow, isPending } = useMutation({
    mutationFn: (shouldFollow: boolean) => shouldFollow ? followUser(userId) : unfollowUser(userId),
    onMutate: (shouldFollow) => {
      const wasFollowing = isFollowing;
      setIsFollowing(shouldFollow);
      setFollowerCount((prev) => shouldFollow ? prev + 1 : prev - 1);
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
      setFollowerCount((prev) => wasFollowing ? prev + 1 : prev - 1);
      toast.error(getApiErrorMessage(err, { client: "요청에 실패했습니다." }));
    },
  });

  const showLoading = useDelayedPending(isPending);

  const followButton = (
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
  );

  return (
    <section className="relative bg-bg-card rounded-2xl p-5 md:flex md:items-start md:gap-6 md:p-6">
      {/* 모바일: 아바타 옆에 스탯을 배치 */}
      <div className="flex items-center gap-4 md:contents">
        <div className="relative shrink-0">
          <Avatar size="xl" src={profile.profile_img || undefined} initial={initial} />
        </div>

        <div className="flex-1 min-w-0">
          {/* 데스크톱: 닉네임 + 팔로우 버튼 + name + intro */}
          <div className="hidden md:block">
            <div className="flex items-center gap-3 min-w-0">
              <h2 className="text-lg font-bold text-text truncate min-w-0">{profile.nickname}</h2>
              {followButton}
            </div>
            {profile.name && <p className="text-xs text-text-muted mt-2">{profile.name}</p>}
            {profile.intro && (
              <p className="text-sm text-text-muted mt-1 whitespace-pre-wrap">{profile.intro}</p>
            )}
          </div>
          <div className="flex gap-2 sm:justify-end md:hidden">
            <StatItem label="팔로워" value={followerCount} href={`/followers?tab=followers&userId=${userId}`} />
            <StatItem label="팔로잉" value={profile.following} href={`/followers?tab=following&userId=${userId}`} />
          </div>
        </div>
      </div>

      <div className="hidden md:flex md:flex-col md:items-end md:gap-3 md:shrink-0">
        <div className="flex gap-6">
          <StatItem label="팔로워" value={followerCount} href={`/followers?tab=followers&userId=${userId}`} />
          <StatItem label="팔로잉" value={profile.following} href={`/followers?tab=following&userId=${userId}`} />
        </div>
      </div>

      {/* 모바일: 닉네임 + 팔로우 버튼 + name + intro */}
      <div className="mt-3 md:hidden">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-text truncate min-w-0">{profile.nickname}</h2>
          {followButton}
        </div>
        {profile.name && <p className="text-xs text-text-muted mt-2 truncate">{profile.name}</p>}
        {profile.intro && (
          <p className="text-sm text-text-muted mt-1 whitespace-pre-wrap">{profile.intro}</p>
        )}
      </div>
    </section>
  );
}
