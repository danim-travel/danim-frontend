"use client"
import { Check } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Avatar, Button, UserRow } from "@/components/common"
import { followUser, unfollowUser } from "@/lib/api/users"
import { getApiErrorMessage } from "@/lib/apiError"
import { toast } from "@/store/toastStore"
import type { FollowUser } from "@/types"

const AVATAR_COLORS = [
  "bg-primary",
  "bg-(--color-mint-300)",
  "bg-(--color-mint-600)",
  "bg-(--color-yellow-500)",
  "bg-(--color-red-500)",
  "bg-(--color-gray-400)",
  "bg-(--color-gray-600)",
  "bg-(--color-gray-700)",
]

function getAvatarColor(userId: string) {
  let hash = 0
  for (const c of userId) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

interface FollowUserItemProps {
  user: FollowUser
  followersQueryKey: readonly string[]
  followingQueryKey: readonly string[]
  isMutualFollow: boolean
}

type FollowCache = FollowUser[] | undefined

function applyIsFollowing(cache: FollowCache, targetId: string, isFollowing: boolean): FollowUser[] {
  return (cache ?? []).map(u => u.user_id === targetId ? { ...u, is_following: isFollowing } : u)
}

export function FollowUserItem({ user, followersQueryKey, followingQueryKey, isMutualFollow }: FollowUserItemProps) {
  const queryClient = useQueryClient()

  async function prepareOptimistic(isFollowing: boolean) {
    await queryClient.cancelQueries({ queryKey: followersQueryKey })
    await queryClient.cancelQueries({ queryKey: followingQueryKey })

    const prevFollowers = queryClient.getQueryData<FollowUser[]>(followersQueryKey)
    const prevFollowing = queryClient.getQueryData<FollowUser[]>(followingQueryKey)

    queryClient.setQueryData(followersQueryKey, applyIsFollowing(prevFollowers, user.user_id, isFollowing))
    queryClient.setQueryData(followingQueryKey, applyIsFollowing(prevFollowing, user.user_id, isFollowing))

    return { prevFollowers, prevFollowing }
  }

  function rollback(context: { prevFollowers: FollowCache; prevFollowing: FollowCache } | undefined) {
    queryClient.setQueryData(followersQueryKey, context?.prevFollowers)
    queryClient.setQueryData(followingQueryKey, context?.prevFollowing)
  }

  function invalidateBoth() {
    queryClient.invalidateQueries({ queryKey: followersQueryKey })
    queryClient.invalidateQueries({ queryKey: followingQueryKey })
  }

  const followMutation = useMutation({
    mutationFn: () => followUser(user.user_id),
    onMutate: () => prepareOptimistic(true),
    onError: (err, _, context) => {
      rollback(context)
      toast.error(getApiErrorMessage(err, { client: "팔로우에 실패했습니다." }))
    },
    onSettled: invalidateBoth,
  })

  const unfollowMutation = useMutation({
    mutationFn: () => unfollowUser(user.user_id),
    onMutate: () => prepareOptimistic(false),
    onError: (err, _, context) => {
      rollback(context)
      toast.error(getApiErrorMessage(err, { client: "팔로우 취소에 실패했습니다." }))
    },
    onSettled: invalidateBoth,
  })

  const isPending = followMutation.isPending || unfollowMutation.isPending

  const mutualBadge = isMutualFollow ? (
    <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium text-primary bg-(--color-primary-soft)">
      맞팔
    </span>
  ) : null

  return (
    <UserRow
      avatar={
        <Avatar
          src={user.profile_img ?? undefined}
          initial={user.nickname[0]}
          size="lg"
          colorClass={getAvatarColor(user.user_id)}
        />
      }
      title={user.nickname}
      titleSuffix={mutualBadge}
      trailing={
        user.is_following ? (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Check size={14} />}
            loading={isPending}
            disabled={isPending}
            onClick={() => unfollowMutation.mutate()}
          >
            팔로잉
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            loading={isPending}
            disabled={isPending}
            onClick={() => followMutation.mutate()}
          >
            팔로우
          </Button>
        )
      }
    />
  )
}
