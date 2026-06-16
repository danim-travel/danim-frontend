"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Avatar, UserRow, UserRowSkeleton, EmptyState, SideDrawer, SearchBar } from "@/components/common"
import { useUIStore } from "@/store/uiStore"
import { useAuthStore } from "@/store/authStore"
import { searchUsers } from "@/lib/api/users"
import { queryKeys } from "@/lib/queryKeys"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"

export function SearchDrawer() {
  const router = useRouter()
  const { activePanel, closePanel } = useUIStore()
  const myUserId = useAuthStore((s) => s.user?.userId)
  const isOpen = activePanel === "search"
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebouncedValue(query.trim(), 300)

  const handleClose = () => {
    closePanel()
  }

  // exit 애니메이션(250ms) 완료 후 검색 상태 초기화 — 닫히는 중 flash 방지
  useEffect(() => {
    if (isOpen) return
    const t = setTimeout(() => {
      setQuery("")
    }, 250)
    return () => clearTimeout(t)
  }, [isOpen])

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.users.search(debouncedQuery),
    queryFn: () => searchUsers(debouncedQuery),
    enabled: debouncedQuery.length > 0,
    staleTime: 30_000,
  })

  return (
    <SideDrawer
      open={isOpen}
      onClose={handleClose}
      title="검색"
      className="left-(--sidebar-width) w-[calc(var(--panel-width)+20px)] z-(--z-drawer)"
    >
      {/* 검색 인풋 */}
      <div className="px-8 pb-4 shrink-0">
        <SearchBar
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => setQuery("")}
          placeholder="닉네임으로 검색..."
          autoFocus
          variant="panel"
        />
      </div>

      {/* 결과 영역 */}
      <div className="flex-1 overflow-y-auto">
        {!query && (
          <p className="px-8 text-body-sm text-text-muted py-6">
            닉네임을 입력해 유저를 검색하세요
          </p>
        )}
        {query && isLoading && (
          <div data-testid="search-loading" className="px-8 pt-2">
            <UserRowSkeleton rows={5} />
          </div>
        )}
        {query && !isLoading && isError && (
          <EmptyState title="검색 중 오류가 발생했습니다" description="잠시 후 다시 시도해주세요." />
        )}
        {query && !isLoading && !isError && data?.length === 0 && (
          <EmptyState title="검색 결과가 없어요" description="다른 닉네임을 입력해보세요." />
        )}
        {query && !isLoading && !isError && data && data.length > 0 && (
          <ul data-testid="search-results">
            {data.map((user) => (
              <li key={user.user_id} data-testid="user-search-result">
                <UserRow
                  avatar={
                    <Avatar
                      src={user.profile_img ?? undefined}
                      initial={user.nickname[0]?.toUpperCase() ?? "?"}
                      size="md"
                    />
                  }
                  title={user.nickname}
                  onClick={() => {
                    router.push(user.user_id === myUserId ? "/mypage" : `/users/${user.user_id}`)
                    handleClose()
                  }}
                  className="px-8 h-(--list-item-height) hover:bg-bg-subtle transition-colors"
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </SideDrawer>
  )
}
