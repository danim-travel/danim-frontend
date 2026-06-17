'use client'

import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import {
  getConversations,
  getMessages,
  createConversation,
  leaveConversation,
  deleteMessage,
} from '@/lib/api/dm'
import { queryKeys } from '@/lib/queryKeys'
import { getApiErrorMessage } from '@/lib/apiError'
import { toast } from '@/store/toastStore'
import type { MessageListResponse, CreateConversationResponse } from '@/types'

export function useConversations() {
  return useQuery({
    queryKey: queryKeys.dm.conversations,
    queryFn: getConversations,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}

export function useMessages(conversationId: string) {
  return useInfiniteQuery<
    MessageListResponse,
    Error,
    InfiniteData<MessageListResponse>,
    ReturnType<typeof queryKeys.dm.messages>,
    string | null
  >({
    queryKey: queryKeys.dm.messages(conversationId),
    queryFn: ({ pageParam }) =>
      getMessages(conversationId, pageParam ?? undefined),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.next ?? undefined,
    enabled: !!conversationId,
    refetchOnWindowFocus: false,
  })
}

export function useCreateConversation() {
  const queryClient = useQueryClient()

  return useMutation<CreateConversationResponse, Error, string>({
    mutationFn: (receiverId) => createConversation(receiverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dm.conversations })
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, { client: '대화방을 열 수 없습니다.' }))
    },
  })
}

export function useLeaveConversation() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (conversationId) => leaveConversation(conversationId),
    onSuccess: (_, conversationId) => {
      queryClient.removeQueries({ queryKey: queryKeys.dm.messages(conversationId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.dm.conversations })
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, { client: '대화방을 나갈 수 없습니다.' }))
    },
  })
}

export function useDeleteMessage(conversationId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (messageId) => deleteMessage(conversationId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dm.messages(conversationId) })
      // C5: 삭제된 메시지가 last_message였을 경우 대화방 목록도 갱신
      queryClient.invalidateQueries({ queryKey: queryKeys.dm.conversations })
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, { client: '메시지를 삭제할 수 없습니다.' }))
    },
  })
}
