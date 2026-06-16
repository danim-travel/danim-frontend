"use client"
import { useQuery } from "@tanstack/react-query"
import { useQueryState } from "nuqs"
import { useAuthStore } from "@/store/authStore"
import { Tabs, PageContainer } from "@/components/common"
import { getFollowers, getFollowing } from "@/lib/api/users"
import { queryKeys } from "@/lib/queryKeys"
import { FollowList } from "./_components/FollowList"
import { Spinner } from "@/components/ui/spinner"
import { useAuthHydrationFallback } from "@/hooks/useAuthHydrationFallback"

export default function FollowersPage() {
  const [tab, setTab] = useQueryState<"followers" | "following">("tab", {
    defaultValue: "followers",
    parse: (v) => (v === "following" ? "following" : "followers"),
  })
  const [queryUserId] = useQueryState("userId")
  const myUserId = useAuthStore(s => s.user?.userId)
  const accessToken = useAuthStore(s => s.accessToken)
  const { authFallbackMessage } = useAuthHydrationFallback()

  const userId = queryUserId ?? myUserId
  const isOtherUser = !!queryUserId && queryUserId !== myUserId

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

  // 새로고침 직후 accessToken은 있지만 userId가 아직 null인 타이밍을 처리
  if (!userId) {
    // accessToken도 없고 fallback 메시지도 없으면 AuthGuard가 처리
    // fallback 메시지가 있으면 clearAuth() 이후에도 에러 UI를 표시해야 하므로 통과
    if (!accessToken && !authFallbackMessage) return null

    // userId 복원 중: useAuthHydrationFallback이 getCurrentUser()를 호출해 Zustand를 채움
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-20">
          {authFallbackMessage ? <p className="text-text-muted">{authFallbackMessage}</p> : <Spinner size="lg" />}
        </div>
      </PageContainer>
    )
  }

  const tabItems = [
    { key: "followers", label: "팔로워", count: followers?.length },
    { key: "following", label: "팔로잉", count: following.length },
  ]

  return (
    <PageContainer>
      <h1 className="text-section-title font-bold text-text mb-6">
        {isOtherUser ? "팔로워 / 팔로잉" : "내 팔로워 / 팔로잉"}
      </h1>
      <div className="bg-bg-card rounded-card border border-border overflow-hidden">
        <Tabs
          items={tabItems}
          value={tab}
          onChange={k => setTab(k as "followers" | "following", { shallow: true })}
        />
        <div>
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
