"use client";
import { useState } from "react";
import Link from "next/link";
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

const statCardClass = "flex flex-col items-center bg-bg rounded-xl px-4 py-3 w-[160px] hover:bg-bg-subtle transition-colors";

export default function UserProfileHeader({ profile, userId }: UserProfileHeaderProps) {
  const queryClient = useQueryClient();
  const [isFollowing, setIsFollowing] = useState(profile.is_following);
  const [followerCount, setFollowerCount] = useState(profile.follower);
  const initial = profile.nickname.slice(0, 1).toUpperCase();

  const { mutate: toggleFollow, isPending } = useMutation({
    mutationFn: () => isFollowing ? unfollowUser(userId) : followUser(userId),
    onMutate: () => {
      const wasFollowing = isFollowing;
      setIsFollowing(!wasFollowing);
      setFollowerCount((prev) => wasFollowing ? prev - 1 : prev + 1);
      return { wasFollowing };
    },
    onSuccess: (res) => {
      setIsFollowing(res.is_followed);
      setFollowerCount(res.follower_count);
      queryClient.invalidateQueries({ queryKey: queryKeys.users.profile(userId) });
    },
    onError: (err, _, context) => {
      const wasFollowing = context?.wasFollowing;
      setIsFollowing(wasFollowing ?? !isFollowing);
      setFollowerCount((prev) => wasFollowing ? prev + 1 : prev - 1);
      toast.error(getApiErrorMessage(err, { client: "요청에 실패했습니다." }));
    },
  });

  const showLoading = useDelayedPending(isPending);

  return (
    <section className="flex items-start gap-6 bg-bg-card rounded-2xl p-6">
      <Avatar size="xl" src={profile.profile_img || undefined} initial={initial} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-text">{profile.nickname}</h2>
          <Button
            variant={isFollowing ? "outline" : "primary"}
            size="sm"
            className="w-24"
            onClick={() => toggleFollow()}
            loading={showLoading}
            disabled={isPending}
          >
            {isFollowing ? "팔로잉" : "팔로우"}
          </Button>
        </div>
        {profile.name && (
          <p className="text-xs text-text-muted mt-0.5">{profile.name}</p>
        )}
        {profile.intro && (
          <p className="text-sm text-text-muted mt-1 whitespace-pre-wrap">{profile.intro}</p>
        )}
      </div>

      <div className="flex flex-col items-end gap-3 shrink-0">
        <div className="flex gap-6">
          <Link href={`/followers?tab=followers&userId=${userId}`} className={statCardClass}>
            <div className="text-xl font-bold text-text">{formatCount(followerCount)}</div>
            <div className="text-xs text-text-muted mt-1">팔로워</div>
          </Link>
          <Link href={`/followers?tab=following&userId=${userId}`} className={statCardClass}>
            <div className="text-xl font-bold text-text">{formatCount(profile.following)}</div>
            <div className="text-xs text-text-muted mt-1">팔로잉</div>
          </Link>
        </div>
      </div>
    </section>
  );
}
