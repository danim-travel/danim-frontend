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
      queryClient.invalidateQueries({ queryKey: queryKeys.dm.conversations, exact: true })
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
      queryClient.invalidateQueries({ queryKey: queryKeys.dm.conversations, exact: true })
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, { client: '대화방을 나갈 수 없습니다.' }))
    },
  })
}

export function useDeleteMessage(conversationId: string) {
  const queryClient = useQueryClient()
  const messagesKey = queryKeys.dm.messages(conversationId)

  return useMutation<void, Error, string, { previous: InfiniteData<MessageListResponse> | undefined }>({
    mutationFn: (messageId) => deleteMessage(conversationId, messageId),
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey: messagesKey })
      const previous = queryClient.getQueryData<InfiniteData<MessageListResponse>>(messagesKey)
      queryClient.setQueryData<InfiniteData<MessageListResponse>>(messagesKey, (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            results: page.results.map(m =>
              m.message_id === messageId ? { ...m, is_deleted: true } : m
            ),
          })),
        }
      })
      return { previous }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagesKey })
      // 삭제된 메시지가 last_message였을 경우 대화방 목록도 갱신
      queryClient.invalidateQueries({ queryKey: queryKeys.dm.conversations, exact: true })
    },
    onError: (err, _messageId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(messagesKey, context.previous)
      }
      toast.error(getApiErrorMessage(err, { client: '메시지를 삭제할 수 없습니다.' }))
    },
  })
}
