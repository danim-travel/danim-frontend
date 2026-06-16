"use client"
import { Check } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Avatar, Button, UserRow } from "@/components/common"
import { followUser, unfollowUser } from "@/lib/api/users"
import { getApiErrorMessage } from "@/lib/apiError"
import { toast } from "@/store/toastStore"
import { useDelayedPending } from "@/hooks/useDelayedPending"
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

/** userId 해시값 기반으로 아바타 배경색을 결정한다. */
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

/** 캐시 배열에서 targetId에 해당하는 유저의 is_following만 교체한 새 배열을 반환한다. */
function applyIsFollowing(cache: FollowCache, targetId: string, isFollowing: boolean): FollowUser[] {
  return (cache ?? []).map(u => u.user_id === targetId ? { ...u, is_following: isFollowing } : u)
}

/** 팔로워/팔로잉 목록의 유저 행 컴포넌트. 팔로우·언팔로우 토글과 낙관적 업데이트를 담당한다. */
export function FollowUserItem({ user, followersQueryKey, followingQueryKey, isMutualFollow }: FollowUserItemProps) {
  const queryClient = useQueryClient()

  /** 진행 중인 쿼리를 취소하고 이전 캐시를 스냅샷한 뒤 낙관적 업데이트를 적용한다. */
  async function prepareOptimistic(isFollowing: boolean) {
    await queryClient.cancelQueries({ queryKey: followersQueryKey })
    await queryClient.cancelQueries({ queryKey: followingQueryKey })

    const prevFollowers = queryClient.getQueryData<FollowUser[]>(followersQueryKey)
    const prevFollowing = queryClient.getQueryData<FollowUser[]>(followingQueryKey)

    queryClient.setQueryData(followersQueryKey, applyIsFollowing(prevFollowers, user.user_id, isFollowing))
    queryClient.setQueryData(followingQueryKey, applyIsFollowing(prevFollowing, user.user_id, isFollowing))

    return { prevFollowers, prevFollowing }
  }

  /** API 실패 시 스냅샷으로 캐시를 복원한다. */
  function rollback(context: { prevFollowers: FollowCache; prevFollowing: FollowCache } | undefined) {
    queryClient.setQueryData(followersQueryKey, context?.prevFollowers)
    queryClient.setQueryData(followingQueryKey, context?.prevFollowing)
  }

  /** 팔로워·팔로잉 쿼리를 무효화해 서버 데이터와 동기화한다. */
  function invalidateBoth() {
    queryClient.invalidateQueries({ queryKey: followersQueryKey })
    queryClient.invalidateQueries({ queryKey: followingQueryKey })
  }

  const toggleMutation = useMutation({
    mutationFn: (shouldFollow: boolean) =>
      shouldFollow ? followUser(user.user_id) : unfollowUser(user.user_id),
    onMutate: (shouldFollow) => prepareOptimistic(shouldFollow),
    onError: (err, _, context) => {
      rollback(context)
      toast.error(getApiErrorMessage(err, { client: "팔로우 변경에 실패했습니다." }))
    },
    onSettled: invalidateBoth,
  })

  const isPending = toggleMutation.isPending
  const showLoading = useDelayedPending(isPending)

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
            className="w-24"
            leftIcon={<Check size={14} />}
            loading={showLoading}
            disabled={isPending}
            onClick={() => toggleMutation.mutate(false)}
          >
            팔로잉
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-24"
            loading={showLoading}
            disabled={isPending}
            onClick={() => toggleMutation.mutate(true)}
          >
            팔로우
          </Button>
        )
      }
    />
  )
}
