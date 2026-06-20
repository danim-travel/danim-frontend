"use client"
import { useState, useRef, useCallback } from "react"
import Link from "next/link"
import { Avatar, Button, Modal } from "@/components/common"
import { cn } from "@/lib/utils"
import { useOnClickOutside } from "@/hooks/useOnClickOutside"
import { useDeleteMessage } from "@/hooks/useDmQueries"
import type { Message, UserBrief } from "@/types"

interface Props {
  message: Message
  isMine: boolean
  /** 연속된 메시지 중 마지막 메시지일 때 아바타를 표시한다 */
  showAvatar: boolean
  opponent: UserBrief
  conversationId: string
}

export function ChatBubble({ message, isMine, showAvatar, opponent, conversationId }: Props) {
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { mutate: deleteMessage, isPending } = useDeleteMessage(conversationId)

  const closeMenu = useCallback(() => setShowMenu(false), [])
  useOnClickOutside(menuRef, closeMenu, showMenu)

  const handleDeleteConfirm = () => {
    deleteMessage(message.message_id, {
      onSuccess: () => setShowDeleteModal(false),
    })
  }

  if (message.is_deleted) {
    return (
      <div className={cn("flex gap-2 items-end", isMine ? "justify-end" : "justify-start")}>
        {!isMine && <div className="w-8 shrink-0" />}
        <span className="px-3 py-2 text-body-sm text-text-muted border border-border rounded-pill italic">
          삭제된 메시지입니다.
        </span>
      </div>
    )
  }

  return (
    <>
      <div className={cn("flex gap-2 items-end", isMine ? "justify-end" : "justify-start")}>
        {/* 상대방 아바타 — 연속 메시지 중 마지막에만 표시 */}
        {!isMine && (
          <div className="w-8 shrink-0 self-end pb-1">
            {showAvatar && (
              <Link href={`/users/${opponent.user_id}`}>
                <Avatar
                  src={opponent.profile_img ?? undefined}
                  initial={opponent.nickname[0]?.toUpperCase() ?? "?"}
                  size="sm"
                />
              </Link>
            )}
          </div>
        )}

        {/* 버블 + 드롭다운 컨테이너 */}
        <div
          ref={menuRef}
          className={cn("relative flex flex-col gap-1 max-w-[70%]", isMine ? "items-end" : "items-start")}
        >
          {/* 내 메시지만 클릭 시 삭제 메뉴 토글 */}
          <div
            onClick={() => isMine && setShowMenu(v => !v)}
            className={cn(isMine && "cursor-pointer")}
          >
            {message.img_url && (
              <div className="rounded-card overflow-hidden bg-bg-subtle">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={message.img_url}
                  alt="이미지"
                  className="max-w-[240px] max-h-[240px] w-full object-cover block"
                />
              </div>
            )}
            {message.content && (
              <div
                className={cn(
                  "px-4 py-2.5 text-body-sm break-all whitespace-pre-wrap",
                  isMine
                    ? "bg-primary text-text-inverse rounded-[18px] rounded-br-[4px]"
                    : "bg-bg-subtle text-text rounded-[18px] rounded-bl-[4px]"
                )}
              >
                {message.content}
              </div>
            )}
          </div>

          {/* 삭제 드롭다운 */}
          {showMenu && (
            <div className="absolute bottom-full mb-1 right-0 bg-bg-card border border-border rounded-card shadow-modal py-1 min-w-[80px] z-10">
              <button
                type="button"
                className="w-full px-3 py-2 text-body-sm text-left text-error hover:bg-bg-subtle transition-colors"
                onClick={() => { setShowMenu(false); setShowDeleteModal(true) }}
              >
                삭제
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="메시지 삭제"
        className="max-w-sm"
        footer={
          <>
            <Button variant="outline" disabled={isPending} onClick={() => setShowDeleteModal(false)}>취소</Button>
            <Button variant="primary" loading={isPending} disabled={isPending} onClick={handleDeleteConfirm}>삭제</Button>
          </>
        }
        footerAlign="stretch"
      >
        <p className="text-body-sm text-text">메시지를 삭제하시겠습니까?</p>
      </Modal>
    </>
  )
}
