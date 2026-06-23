"use client"

import { MessageSquare } from "lucide-react"
import { EmptyState } from "@/components/common"
import { useAuthStore } from "@/store/authStore"
import { getApiErrorMessage } from "@/lib/apiError"
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
    // 업로드 전에 blob URL을 생성해 낙관적 메시지에 사용 —
    // 업로드 API의 img_url이 private S3 raw URL이면 echo 전까지 403이 나므로
    // 로컬 blob URL로 즉시 표시하고, echo 수신 후 서버가 CDN URL로 교체한다
    const blobUrl = URL.createObjectURL(file)
    try {
      const { img_url, key } = await uploadDmImage(conversationId, file)
      // key(original_img)를 전달 — 서버가 key로 CDN URL을 생성해 echo로 내려준다
      // displayImgUrl(blobUrl)은 echo 도착 전 낙관적 창에만 사용
      sendMessage("", img_url, key, blobUrl)
    } catch (err) {
      URL.revokeObjectURL(blobUrl)
      toast.error(getApiErrorMessage(err, { client: '이미지를 전송할 수 없습니다.' }))
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
