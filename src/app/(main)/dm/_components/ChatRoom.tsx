"use client"

import { MessageSquare } from "lucide-react"
import { EmptyState } from "@/components/common"
import { useAuthStore } from "@/store/authStore"
import { useConversations } from "@/hooks/useDmQueries"
import { useDmSocket } from "@/hooks/useDmSocket"
import { ChatHeader } from "./ChatHeader"
import { MessageList } from "./MessageList"
import { ChatComposer } from "./ChatComposer"

interface Props {
  conversationId: string
}

export function ChatRoom({ conversationId }: Props) {
  const myUserId = useAuthStore(s => s.user?.userId)
  const accessToken = useAuthStore(s => s.accessToken)
  const { data: conversations = [], isLoading } = useConversations()
  const conversation = conversations.find(c => c.conversation_id === conversationId)

  const { sendMessage, isReady } = useDmSocket(conversationId, accessToken, myUserId ?? null)

  // conversations 로드 중이면 대기
  if (!myUserId || isLoading) return null

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          icon={<MessageSquare size={36} />}
          title="대화방을 찾을 수 없어요"
          description="목록에서 대화방을 선택해보세요."
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full">
      <ChatHeader opponent={conversation.opponent} />
      <MessageList
        conversationId={conversationId}
        myUserId={myUserId}
        opponent={conversation.opponent}
      />
      <ChatComposer onSend={sendMessage} disabled={!isReady} />
    </div>
  )
}
