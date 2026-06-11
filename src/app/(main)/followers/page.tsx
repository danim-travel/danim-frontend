"use client"
import { useQuery } from "@tanstack/react-query"
import { useQueryState } from "nuqs"
import { useAuthStore } from "@/store/authStore"
import { Tabs, PageContainer } from "@/components/common"
import { getFollowers, getFollowing } from "@/lib/api/users"
import { queryKeys } from "@/lib/queryKeys"
import { FollowList } from "./_components/FollowList"

export default function FollowersPage() {
  const [tab, setTab] = useQueryState<"followers" | "following">("tab", {
    defaultValue: "followers",
    parse: (v) => (v === "following" ? "following" : "followers"),
  })
  const userId = useAuthStore(s => s.user?.userId)

  const { data: followers = [], isLoading: isFollowersLoading } = useQuery({
    queryKey: queryKeys.users.followers(userId ?? ""),
    queryFn: () => getFollowers(userId!),
    enabled: !!userId,
  })
  const { data: following = [], isLoading: isFollowingLoading } = useQuery({
    queryKey: queryKeys.users.following(userId ?? ""),
    queryFn: () => getFollowing(userId!),
    enabled: !!userId,
  })

  if (!userId) return null

  const tabItems = [
    { key: "followers", label: "팔로워", count: followers?.length },
    { key: "following", label: "팔로잉", count: following.filter(u => u.is_following).length },
  ]

  return (
    <PageContainer>
      <h1 className="text-section-title font-bold text-text mb-6">내 팔로워 / 팔로잉</h1>
      <div className="bg-bg-card rounded-card border border-border overflow-hidden">
        <Tabs
          items={tabItems}
          value={tab}
          onChange={k => setTab(k as "followers" | "following", { shallow: true })}
        />
        <div className="px-7">
          <FollowList
            userId={userId}
            tab={tab}
            followers={followers}
            following={following}
            isLoading={tab === "followers" ? isFollowersLoading : isFollowingLoading}
          />
        </div>
      </div>
    </PageContainer>
  )
}
