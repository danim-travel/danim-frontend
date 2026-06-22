"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { X } from "lucide-react"
import { SideDrawer, UserRowSkeleton, EmptyState } from "@/components/common"
import { useUIStore } from "@/store/uiStore"
import { useInfiniteScrollSentinel } from "@/hooks/async/useInfiniteScrollSentinel"
import {
  useDeleteAllNotifications,
  useMarkAllNotificationsRead,
  useNotificationsQuery,
} from "../_hooks/useNotifications"
import { NotificationFilter, type NotificationFilterValue } from "./NotificationFilter"
import { NotificationItem } from "./NotificationItem"

export function NotificationDrawer() {
  const activePanel = useUIStore((s) => s.activePanel)
  const closePanel = useUIStore((s) => s.closePanel)
  const pathname = usePathname()
  const isOpen = activePanel === "notification"

  const [filter, setFilter] = useState<NotificationFilterValue>("all")

  // 드로어 닫힘 애니메이션(250ms) 후 필터 초기화 — 닫히는 중 flash 방지
  useEffect(() => {
    if (isOpen) return
    const t = setTimeout(() => setFilter("all"), 250)
    return () => clearTimeout(t)
  }, [isOpen])

  // 페이지 이동 시 드로어 자동 닫힘
  useEffect(() => {
    closePanel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // ESC로 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) closePanel()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isOpen, closePanel])

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

  // 모바일·데스크톱 공용 본문 (padding은 responsive class로 구분)
  const headerActions = (
    <div className="px-4 md:px-8 pb-3 flex items-center justify-end gap-3 shrink-0">
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
  )

  const listSection = (
    <div className="flex-1 overflow-y-auto">
      {isLoading && (
        <div className="px-4 md:px-8 pt-4">
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
        <div className="px-4 md:px-8 py-4">
          <UserRowSkeleton rows={2} />
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* 모바일: MobileHeader 뒤에서 위→아래 슬라이드 (SearchDrawer와 동일 패턴) */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed top-16 inset-x-0 bottom-0 z-[4] md:hidden"
              onClick={closePanel}
              aria-hidden="true"
            />
            <motion.section
              key="mobile-notification"
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
              className="fixed top-16 inset-x-0 bg-bg-card border-b border-border shadow-overlay flex flex-col md:hidden z-(--z-drawer)"
              style={{ maxHeight: "calc(100dvh - 4rem)" }}
            >
              <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
                <div className="flex items-center gap-3">
                  <h2 className="text-body font-semibold text-text">알림</h2>
                  <span aria-hidden className="w-px h-3 bg-border" />
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
                <button
                  type="button"
                  onClick={closePanel}
                  className="w-9 h-9 -mr-2 flex items-center justify-center rounded-xl hover:bg-bg-subtle transition-colors"
                  aria-label="알림 닫기"
                >
                  <X className="w-5 h-5 text-text-muted" strokeWidth={2} />
                </button>
              </div>
              <div className="shrink-0">
                <NotificationFilter value={filter} onChange={setFilter} />
              </div>
              {listSection}
            </motion.section>
          </>
        )}
      </AnimatePresence>

      {/* 데스크톱: 기존 SideDrawer */}
      <SideDrawer
        open={isOpen}
        onClose={closePanel}
        title="알림"
        className="max-md:hidden left-(--sidebar-width) w-[calc(var(--panel-width)+20px)] z-(--z-drawer)"
      >
        {headerActions}
        <div className="shrink-0">
          <NotificationFilter value={filter} onChange={setFilter} />
        </div>
        {listSection}
      </SideDrawer>
    </>
  )
}

export default NotificationDrawer
