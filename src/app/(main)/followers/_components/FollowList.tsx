"use client"
import { useQuery } from "@tanstack/react-query"
import { Users } from "lucide-react"
import { EmptyState, UserRowSkeleton } from "@/components/common"
import { getFollowers, getFollowing } from "@/lib/api/users"
import { queryKeys } from "@/lib/queryKeys"
import { FollowUserItem } from "./FollowUserItem"

interface FollowListProps {
  userId: string
  tab: "followers" | "following"
}

export function FollowList({ userId, tab }: FollowListProps) {
  const isFollowers = tab === "followers"
  const followersQueryKey = queryKeys.users.followers(userId)
  const followingQueryKey = queryKeys.users.following(userId)

  const { data: followers = [], isLoading: isFollowersLoading } = useQuery({
    queryKey: followersQueryKey,
    queryFn: () => getFollowers(userId),
  })
  const { data: following = [], isLoading: isFollowingLoading } = useQuery({
    queryKey: followingQueryKey,
    queryFn: () => getFollowing(userId),
  })

  const isLoading = isFollowers ? isFollowersLoading : isFollowingLoading
  const list = isFollowers ? followers : following

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
    <ul className="divide-y divide-border">
      {list.map(user => (
        <li key={user.user_id} className="py-4">
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
