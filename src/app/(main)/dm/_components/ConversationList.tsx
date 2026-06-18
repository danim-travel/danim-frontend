"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MessageSquare } from "lucide-react"
import { EmptyState, SearchBar, UserRowSkeleton } from "@/components/common"
import { useConversations } from "@/hooks/useDmQueries"
import { ConversationItem } from "./ConversationItem"

interface Props {
  activeConversationId?: string
}

export function ConversationList({ activeConversationId }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const { data: conversations = [], isLoading } = useConversations()

  const filtered = search
    ? conversations.filter(c =>
        c.opponent.nickname.toLowerCase().includes(search.toLowerCase())
      )
    : conversations

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 shrink-0">
        <SearchBar
          value={search}
          onChange={e => setSearch(e.target.value)}
          onClear={() => setSearch("")}
          placeholder="검색"
          size="sm"
          variant="panel"
        />
      </div>

      <div className="px-4 pb-2 shrink-0">
        <span className="text-body-sm font-semibold text-text">메시지</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="px-4 pt-2">
            <UserRowSkeleton rows={6} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={32} />}
            title={search ? "검색 결과가 없어요" : "대화가 없어요"}
            description={search ? "다른 이름으로 검색해보세요." : "팔로우 중인 사람과 대화를 시작해보세요."}
          />
        ) : (
          <ul>
            {filtered.map(conv => (
              <li key={conv.conversation_id}>
                <ConversationItem
                  conversation={conv}
                  isActive={conv.conversation_id === activeConversationId}
                  onClick={() => router.push(`/dm/${conv.conversation_id}`)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
