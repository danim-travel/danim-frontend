import { MessageSquare } from "lucide-react"
import { EmptyState } from "@/components/common"

export default function DmPage() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <EmptyState
        icon={<MessageSquare size={40} />}
        title="메시지"
        description="대화 목록에서 상대방을 선택해 대화를 시작하세요."
      />
    </div>
  )
}
