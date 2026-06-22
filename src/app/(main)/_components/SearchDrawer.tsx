"use client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { motion, AnimatePresence } from "motion/react"
import { X } from "lucide-react"
import { Avatar, UserRow, UserRowSkeleton, EmptyState, SideDrawer, SearchBar } from "@/components/common"
import { useUIStore } from "@/store/uiStore"
import { useAuthStore } from "@/store/authStore"
import { searchUsers } from "@/lib/api/users"
import { queryKeys } from "@/lib/queryKeys"
import { useDebouncedValue } from "@/hooks/async/useDebouncedValue"
import { useRecentSearches } from "@/app/(main)/_hooks/useRecentSearches"
import type { UserSearchResult } from "@/types/user.types"

export function SearchDrawer() {
  const router = useRouter()
  const pathname = usePathname()
  const activePanel = useUIStore((s) => s.activePanel)
  const closePanel = useUIStore((s) => s.closePanel)
  const setActivePanel = useUIStore((s) => s.setActivePanel)
  const myUserId = useAuthStore((s) => s.user?.userId)
  const isOpen = activePanel === "search"
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebouncedValue(query.trim(), 300)
  const { recentSearches, addRecentSearch, removeRecentSearch } = useRecentSearches()

  const handleClose = () => closePanel()

  useEffect(() => {
    if (isOpen) return
    const t = setTimeout(() => setQuery(""), 250)
    return () => clearTimeout(t)
  }, [isOpen])

  useEffect(() => {
    closePanel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) closePanel()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isOpen, closePanel])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        const el = document.activeElement
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || (el instanceof HTMLElement && el.isContentEditable)) return
        e.preventDefault()
        if (activePanel === "search") closePanel()
        else setActivePanel("search")
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [activePanel, closePanel, setActivePanel])

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.users.search(debouncedQuery),
    queryFn: () => searchUsers(debouncedQuery),
    enabled: debouncedQuery.length > 0,
    staleTime: 30_000,
  })

  const goToUser = (user: UserSearchResult) => {
    addRecentSearch(user)
    router.push(user.user_id === myUserId ? "/mypage" : `/users/${user.user_id}`)
    handleClose()
  }

  // 모바일·데스크톱 공용 결과 목록
  const results = (
    <div className="flex-1 overflow-y-auto">
      {!query && recentSearches.length === 0 && (
        <p className="px-4 md:px-8 text-body-sm text-text-muted py-6">
          닉네임을 입력해 유저를 검색하세요
        </p>
      )}
      {!query && recentSearches.length > 0 && (
        <ul data-testid="recent-searches">
          {recentSearches.map((user) => (
            <li key={user.user_id} data-testid="recent-search-item">
              <UserRow
                avatar={
                  <Avatar
                    src={user.profile_img ?? undefined}
                    initial={user.nickname[0]?.toUpperCase() ?? "?"}
                    size="md"
                  />
                }
                title={user.nickname}
                onClick={() => goToUser(user)}
                trailing={
                  <button
                    type="button"
                    aria-label={`${user.nickname} 검색 기록 삭제`}
                    onClick={(e) => {
                      e.stopPropagation()
                      removeRecentSearch(user.user_id)
                    }}
                    className="p-1 text-text-muted hover:text-text transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                }
                className="px-4 md:px-8 h-(--list-item-height) hover:bg-bg-subtle transition-colors"
              />
            </li>
          ))}
        </ul>
      )}
      {query && isLoading && (
        <div data-testid="search-loading" className="px-4 md:px-8 pt-2">
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
                onClick={() => goToUser(user)}
                className="px-4 md:px-8 h-(--list-item-height) hover:bg-bg-subtle transition-colors"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  return (
    <>
      {/* 모바일 */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed top-16 inset-x-0 bottom-0 z-[4] md:hidden" onClick={handleClose} aria-hidden="true" />
            <motion.section
              key="mobile-search"
              initial={{ y: "-100%" }} animate={{ y: 0 }} exit={{ y: "-100%" }}
              transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
              className="fixed top-16 inset-x-0 bg-bg-card border-b border-border shadow-overlay flex flex-col md:hidden z-(--z-drawer)"
              style={{ maxHeight: "calc(100dvh - 4rem)" }}
            >
              <div className="px-4 pt-3 pb-4 shrink-0">
                <SearchBar value={query} onChange={(e) => setQuery(e.target.value)} onClear={() => setQuery("")} placeholder="닉네임으로 검색..." autoFocus variant="panel" />
              </div>
              {results}
            </motion.section>
          </>
        )}
      </AnimatePresence>

      {/* 데스크톱 */}
      <SideDrawer open={isOpen} onClose={handleClose} title="검색" className="max-md:hidden left-(--sidebar-width) w-[calc(var(--panel-width)+20px)] z-(--z-drawer)">
        <div className="px-8 pb-4 shrink-0">
          <SearchBar value={query} onChange={(e) => setQuery(e.target.value)} onClear={() => setQuery("")} placeholder="닉네임으로 검색..." autoFocus variant="panel" />
        </div>
        {results}
      </SideDrawer>
    </>
  )
}
