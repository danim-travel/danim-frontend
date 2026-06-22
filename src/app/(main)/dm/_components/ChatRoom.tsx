"use client"

import { MessageSquare } from "lucide-react"
import { EmptyState } from "@/components/common"
import { useAuthStore } from "@/store/authStore"
import { toast } from "@/store/toastStore"
import { useConversations } from "@/app/(main)/dm/_hooks/useDmQueries"
import { useDmSocket } from "@/app/(main)/dm/_hooks/useDmSocket"
import { uploadDmImage } from "@/lib/api/dmUpload"
import { ChatHeader } from "./ChatHeader"
import { MessageList } from "./MessageList"
import { ChatComposer } from "./ChatComposer"

interface Props {
  conversationId: string
}

export function ChatRoom({ conversationId }: Props) {
  const myUserId = useAuthStore(s => s.user?.userId)
  const { data: conversations = [], isLoading } = useConversations()
  const conversation = conversations.find(c => c.conversation_id === conversationId)

  const { sendMessage, isReady } = useDmSocket(conversationId, myUserId ?? null)

  const handleSendImage = async (file: File) => {
    try {
      const { img_url, key } = await uploadDmImage(conversationId, file)
      // 댓글 이미지와 동일하게 key(original_img)를 전달 — 서버가 key로 CDN URL을 생성한다
      sendMessage("", img_url, key)
    } catch {
      toast.error("이미지를 전송할 수 없습니다.")
    }
  }

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
      <ChatComposer onSend={sendMessage} onSendImage={handleSendImage} disabled={!isReady} />
    </div>
  )
}
