"use client"

import { useEffect, useRef, useCallback } from "react"
import { format, isSameDay, differenceInMinutes } from "date-fns"
import { ko } from "date-fns/locale"
import { useMessages, useDeleteMessage } from "@/hooks/useDmQueries"
import { useInfiniteScrollSentinel } from "@/hooks/useInfiniteScrollSentinel"
import { UserRowSkeleton } from "@/components/common"
import { ChatBubble } from "./ChatBubble"
import type { UserBrief } from "@/types"

interface Props {
  conversationId: string
  myUserId: string
  opponent: UserBrief
}

function formatDateSeparator(dateStr: string) {
  return format(new Date(dateStr), "yyyy. M. d. a h:mm", { locale: ko })
}

export function MessageList({ conversationId, myUserId, opponent }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const { mutate: deleteMessage, isPending: isDeleting } = useDeleteMessage(conversationId)
  // FIX 5: 두 개의 effect가 isFirstRender 공유 → 초기 로드 시 이중 스크롤 발생 문제 해결
  // prevLastMessageIdRef 하나로 초기 로드(instant)와 신규 메시지(smooth)를 구분
  const prevLastMessageIdRef = useRef<string | undefined>(undefined)

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(conversationId)

  // API는 최신순 반환 → 페이지 역순 + 각 페이지 메시지 역순 = 시간순(오래된 것 위)
  const messages = data?.pages
    .slice()
    .reverse()
    .flatMap(page => [...page.results].reverse()) ?? []

  const lastMessageId = messages[messages.length - 1]?.message_id

  // 마지막으로 표시된 구분선 시각 기준 10분 이상이거나 날짜가 바뀌면 새 구분선 표시
  const showSeparators: boolean[] = []
  let lastSepTime: Date | null = null
  for (const msg of messages) {
    const currTime = new Date(msg.created_at)
    const show =
      !lastSepTime ||
      !isSameDay(currTime, lastSepTime) ||
      differenceInMinutes(currTime, lastSepTime) >= 10
    showSeparators.push(show)
    if (show) lastSepTime = currTime
  }

  // 초기 로드: instant / 새 메시지: smooth / 과거 메시지 추가(fetchNextPage): 미동작
  useEffect(() => {
    if (isLoading || !lastMessageId) return
    if (lastMessageId === prevLastMessageIdRef.current) return

    const isFirstLoad = prevLastMessageIdRef.current === undefined
    prevLastMessageIdRef.current = lastMessageId
    bottomRef.current?.scrollIntoView({ behavior: isFirstLoad ? "instant" : "smooth" })
  }, [isLoading, lastMessageId])

  const handleLoadMore = useCallback(() => {
    fetchNextPage()
  }, [fetchNextPage])

  const sentinelRef = useInfiniteScrollSentinel({
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    onLoadMore: handleLoadMore,
    rootMargin: "100px",
  })

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <UserRowSkeleton rows={6} />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1">
      {/* 최상단 sentinel — 뷰포트 진입 시 이전 메시지 로드 */}
      <div ref={sentinelRef} className="h-px shrink-0" />

      {isFetchingNextPage && (
        <div className="py-2">
          <UserRowSkeleton rows={2} />
        </div>
      )}

      {messages.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-body-sm text-text-muted">대화를 시작해보세요.</p>
        </div>
      )}

      {messages.map((message, idx) => {
        const isMine = message.sender.user_id === myUserId
        const next = messages[idx + 1]

        const showDateSep = showSeparators[idx]

        // 연속 메시지 중 마지막(아래)일 때 아바타 표시
        const showAvatar =
          !isMine &&
          (!next ||
            next.sender.user_id !== message.sender.user_id ||
            !isSameDay(new Date(message.created_at), new Date(next.created_at)))

        return (
          <div key={message.message_id} className="flex flex-col gap-1">
            {showDateSep && (
              <div className="flex justify-center my-3">
                <span className="text-tiny text-text-muted">
                  {formatDateSeparator(message.created_at)}
                </span>
              </div>
            )}
            <ChatBubble
              message={message}
              isMine={isMine}
              showAvatar={showAvatar}
              opponent={opponent}
              onDelete={deleteMessage}
              isPending={isDeleting}
            />
          </div>
        )
      })}

      <div ref={bottomRef} className="shrink-0" />
    </div>
  )
}
