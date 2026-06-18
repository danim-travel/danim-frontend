"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Users } from "lucide-react"
import { Modal, Avatar, UserRow, UserRowSkeleton, EmptyState, SearchBar } from "@/components/common"
import { useAuthStore } from "@/store/authStore"
import { getFollowing } from "@/lib/api/users"
import { queryKeys } from "@/lib/queryKeys"
import { useCreateConversation } from "@/hooks/useDmQueries"

interface Props {
  open: boolean
  onClose: () => void
}

export function NewConversationModal({ open, onClose }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const myUserId = useAuthStore(s => s.user?.userId)
  const { mutate: createConversation, isPending } = useCreateConversation()

  const { data: following = [], isLoading } = useQuery({
    queryKey: queryKeys.users.following(myUserId ?? ""),
    queryFn: () => getFollowing(myUserId!),
    enabled: !!myUserId && open,
    staleTime: 30_000,
  })

  const filtered = search
    ? following.filter(u =>
        u.nickname.toLowerCase().includes(search.toLowerCase())
      )
    : following

  const handleSelect = (userId: string) => {
    createConversation(userId, {
      onSuccess: (result) => {
        handleClose()
        router.push(`/dm/${result.conversation_id}`)
      },
    })
  }

  const handleClose = () => {
    setSearch("")
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="새 대화"
    >
      <div className="flex flex-col gap-4">
        <SearchBar
          value={search}
          onChange={e => setSearch(e.target.value)}
          onClear={() => setSearch("")}
          placeholder="닉네임으로 검색..."
          variant="panel"
        />

        <div className="flex flex-col overflow-y-auto max-h-[360px] min-h-[200px]">
          {isLoading ? (
            <UserRowSkeleton rows={5} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Users size={32} />}
              title={search ? "검색 결과가 없어요" : "팔로우 중인 사람이 없어요"}
              description={search ? "다른 닉네임으로 검색해보세요." : "먼저 다른 사용자를 팔로우해보세요."}
            />
          ) : (
            <ul>
              {filtered.map(user => (
                <li key={user.user_id}>
                  <UserRow
                    avatar={
                      <Avatar
                        src={user.profile_img ?? undefined}
                        initial={user.nickname[0]?.toUpperCase() ?? "?"}
                        size="md"
                      />
                    }
                    title={user.nickname}
                    onClick={() => !isPending && handleSelect(user.user_id)}
                    className="py-2.5 hover:bg-bg-subtle rounded-control transition-colors cursor-pointer"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  )
}
