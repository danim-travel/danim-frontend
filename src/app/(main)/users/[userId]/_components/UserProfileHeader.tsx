"use client";
import { useState } from "react";
import { Check } from "lucide-react";
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
    <section className="rounded-card border border-border bg-bg-card p-5 md:p-6">
      {/* ── 데스크톱 ── */}
      <div className="hidden md:flex md:items-center md:gap-6">
        <Avatar
          size="xl"
          className="h-[88px] w-[88px] shrink-0"
          src={profile.profile_img || undefined}
          initial={initial}
        />

        {/* 닉네임 / 팔로우 버튼 / 소개 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-card-title font-bold text-text truncate min-w-0">
              {profile.nickname}
            </h2>
            {followButton}
          </div>
          {intro && (
            <p className="mt-2 text-body-sm text-text-secondary whitespace-pre-wrap">
              {intro}
            </p>
          )}
        </div>

        {/* 통계 */}
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
        <div className="flex items-start gap-4">
          <Avatar
            size="xl"
            className="h-[72px] w-[72px] shrink-0"
            src={profile.profile_img || undefined}
            initial={initial}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-card-title font-bold text-text truncate min-w-0">
                {profile.nickname}
              </h2>
              {followButton}
            </div>
            <div className="mt-2 flex items-stretch divide-x divide-border">
              <ProfileStat variant="inline" label="게시글" value={profile.posts_count} />
              <ProfileStat
                variant="inline"
                label="팔로워"
                value={followerCount}
                href={`/followers?tab=followers&userId=${userId}`}
              />
              <ProfileStat
                variant="inline"
                label="팔로잉"
                value={profile.following}
                href={`/followers?tab=following&userId=${userId}`}
              />
            </div>
          </div>
        </div>

        {intro && (
          <>
            <hr className="my-4 border-border" />
            <p className="text-body-sm text-text-secondary whitespace-pre-wrap">{intro}</p>
          </>
        )}
      </div>
    </section>
  );
}
