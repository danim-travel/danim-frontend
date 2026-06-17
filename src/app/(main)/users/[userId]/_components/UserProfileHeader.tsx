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
import { useDelayedPending } from "@/hooks/useDelayedPending";
import type { UserProfileResponse } from "@/types";

interface UserProfileHeaderProps {
  profile: UserProfileResponse;
  userId: string;
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

const statCls = "flex flex-col items-center bg-bg rounded-xl px-3 py-2 flex-1 md:flex-none md:px-4 md:py-3 md:w-[160px] hover:bg-bg-subtle transition-colors";

export default function UserProfileHeader({ profile, userId }: UserProfileHeaderProps) {
  const queryClient = useQueryClient();
  const [isFollowing, setIsFollowing] = useState(profile.is_following);
  const [followerCount, setFollowerCount] = useState(profile.follower);
  const initial = profile.nickname.slice(0, 1).toUpperCase();

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
    },
    onError: (err, _, context) => {
      const wasFollowing = context?.wasFollowing ?? isFollowing;
      setIsFollowing(wasFollowing);
      setFollowerCount((prev) => wasFollowing ? prev + 1 : prev - 1);
      toast.error(getApiErrorMessage(err, { client: "요청에 실패했습니다." }));
    },
  });

  const showLoading = useDelayedPending(isPending);

  return (
    <section className="bg-bg-card rounded-2xl p-5 md:p-6">
      {/* 아바타 + (모바일: 스탯 | 데스크톱: 텍스트+스탯+버튼) */}
      <div className="flex items-center gap-4 md:items-start md:gap-6">
        <Avatar size="xl" src={profile.profile_img || undefined} initial={initial} />

        <div className="flex-1 min-w-0">
          {/* 데스크톱: 닉네임 + 팔로우 버튼 + 소개 */}
          <div className="hidden md:block">
            <div className="flex items-center gap-3 min-w-0">
              <h2 className="text-lg font-bold text-text truncate min-w-0">{profile.nickname}</h2>
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
            {profile.name && <p className="text-xs text-text-muted mt-0.5 truncate">{profile.name}</p>}
            {profile.intro && <p className="text-sm text-text-muted mt-1 whitespace-pre-wrap">{profile.intro}</p>}
          </div>

          {/* 스탯: 모바일→아바타 옆, 데스크톱→텍스트 아래 */}
          <div className="flex gap-2 md:gap-6 md:mt-4">
            <Link href={`/followers?tab=followers&userId=${userId}`} className={statCls}>
              <div className="text-xl font-bold text-text">{formatCount(followerCount)}</div>
              <div className="text-xs text-text-muted mt-1">팔로워</div>
            </Link>
            <Link href={`/followers?tab=following&userId=${userId}`} className={statCls}>
              <div className="text-xl font-bold text-text">{formatCount(profile.following)}</div>
              <div className="text-xs text-text-muted mt-1">팔로잉</div>
            </Link>
          </div>
        </div>
      </div>

      {/* 모바일: 닉네임 + 팔로우 버튼 + 소개 (아바타+스탯 아래) */}
      <div className="mt-3 md:hidden">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-text truncate min-w-0">{profile.nickname}</h2>
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
        {profile.name && <p className="text-xs text-text-muted mt-0.5 truncate">{profile.name}</p>}
        {profile.intro && <p className="text-sm text-text-muted mt-1 whitespace-pre-wrap">{profile.intro}</p>}
      </div>
    </section>
  );
}
