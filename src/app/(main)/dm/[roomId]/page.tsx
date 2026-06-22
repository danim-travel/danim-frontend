"use client"

import { useParams } from "next/navigation"
import { ChatRoom } from "../_components/ChatRoom"

export default function DmRoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  return <ChatRoom conversationId={roomId} />
}
