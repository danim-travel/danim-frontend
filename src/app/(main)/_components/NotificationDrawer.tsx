"use client"

import { useEffect, useMemo, useState } from "react"
import { SideDrawer, UserRowSkeleton, EmptyState } from "@/components/common"
import { useUIStore } from "@/store/uiStore"
import { useInfiniteScrollSentinel } from "@/hooks/useInfiniteScrollSentinel"
import {
  useDeleteAllNotifications,
  useMarkAllNotificationsRead,
  useNotificationsQuery,
} from "../_hooks/useNotifications"
import { NotificationFilter, type NotificationFilterValue } from "./NotificationFilter"
import { NotificationItem } from "./NotificationItem"

export function NotificationDrawer() {
  const { activePanel, closePanel } = useUIStore()
  const isOpen = activePanel === "notification"

  const [filter, setFilter] = useState<NotificationFilterValue>("all")

  // 드로어 닫힘 애니메이션(250ms) 후 필터 초기화 — 닫히는 중 flash 방지
  useEffect(() => {
    if (isOpen) return
    const t = setTimeout(() => setFilter("all"), 250)
    return () => clearTimeout(t)
  }, [isOpen])

  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useNotificationsQuery(isOpen)

  const markAllRead = useMarkAllNotificationsRead()
  const deleteAll = useDeleteAllNotifications()

  const sentinelRef = useInfiniteScrollSentinel({
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    onLoadMore: () => fetchNextPage(),
  })

  const allItems = useMemo(
    () => data?.pages.flatMap((p) => p.results) ?? [],
    [data],
  )

  const filteredItems = useMemo(() => {
    if (filter === "all") return allItems
    return allItems.filter((n) => n.notification_type === filter)
  }, [allItems, filter])

  const hasItems = allItems.length > 0

  return (
    <SideDrawer
      open={isOpen}
      onClose={closePanel}
      title="알림"
      className="left-(--sidebar-width) w-[calc(var(--panel-width)+20px)] z-(--z-drawer)"
    >
      {/* 헤더 액션 */}
      <div className="px-8 pb-3 flex items-center justify-end gap-3 shrink-0">
        <button
          type="button"
          onClick={() => markAllRead.mutate()}
          disabled={!hasItems || markAllRead.isPending}
          className="text-caption text-text-muted hover:text-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          전체 읽음
        </button>
        <span aria-hidden className="w-px h-3 bg-border" />
        <button
          type="button"
          onClick={() => deleteAll.mutate()}
          disabled={!hasItems || deleteAll.isPending}
          className="text-caption text-text-muted hover:text-error disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          전체 삭제
        </button>
      </div>

      {/* 필터 */}
      <div className="shrink-0">
        <NotificationFilter value={filter} onChange={setFilter} />
      </div>

      {/* 리스트 영역 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="px-8 pt-4">
            <UserRowSkeleton rows={5} />
          </div>
        )}

        {!isLoading && isError && (
          <EmptyState
            title="알림을 불러올 수 없습니다"
            description="잠시 후 다시 시도해주세요."
          />
        )}

        {!isLoading && !isError && filteredItems.length === 0 && (
          <EmptyState
            title="알림이 없습니다"
            description={
              filter === "all"
                ? "새로운 알림이 도착하면 여기에 표시됩니다."
                : "선택한 카테고리의 알림이 없습니다."
            }
          />
        )}

        {!isLoading && !isError && filteredItems.length > 0 && (
          <ul data-testid="notification-list">
            {filteredItems.map((item) => (
              <li key={item.notification_id}>
                <NotificationItem item={item} />
              </li>
            ))}
          </ul>
        )}

        {/* 무한스크롤 sentinel — 에러 상태에서는 숨겨 무한 재요청 방지 */}
        {hasNextPage && !isError && (
          <div ref={sentinelRef} className="h-4" aria-hidden />
        )}

        {isFetchingNextPage && (
          <div className="px-8 py-4">
            <UserRowSkeleton rows={2} />
          </div>
        )}
      </div>
    </SideDrawer>
  )
}

export default NotificationDrawer
