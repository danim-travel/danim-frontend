"use client"
import { Users } from "lucide-react"
import { EmptyState, UserRowSkeleton } from "@/components/common"
import { queryKeys } from "@/lib/queryKeys"
import type { FollowUser } from "@/types"
import { FollowUserItem } from "./FollowUserItem"

interface FollowListProps {
  userId: string
  tab: "followers" | "following"
  followers: FollowUser[]
  following: FollowUser[]
  isLoading: boolean
}

export function FollowList({ userId, tab, followers, following, isLoading }: FollowListProps) {
  const isFollowers = tab === "followers"
  const followersQueryKey = queryKeys.users.followers(userId)
  const followingQueryKey = queryKeys.users.following(userId)

  const list = isFollowers ? followers : following.filter(u => u.is_following)

  // followers ↔ following userId 교집합으로 맞팔 여부 계산
  const followingIds = new Set(following.filter(u => u.is_following).map(u => u.user_id))
  const followerIds = new Set(followers.map(u => u.user_id))
  const isMutual = (uid: string) => isFollowers ? followingIds.has(uid) : followerIds.has(uid)

  if (isLoading) {
    return <div className="py-4"><UserRowSkeleton rows={4} lines={2} /></div>
  }

  if (list.length === 0) {
    return (
      <EmptyState
        icon={<Users size={40} />}
        title={isFollowers ? "팔로워가 없습니다" : "팔로잉하는 사람이 없습니다"}
      />
    )
  }

  return (
    <ul className="flex flex-col gap-1 py-2">
      {list.map(user => (
        <li key={user.user_id}>
          <FollowUserItem
            user={user}
            followersQueryKey={followersQueryKey}
            followingQueryKey={followingQueryKey}
            isMutualFollow={isMutual(user.user_id)}
          />
        </li>
      ))}
    </ul>
  )
}
