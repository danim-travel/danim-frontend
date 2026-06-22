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
import { getApiErrorMessage, type ApiError } from '@/lib/apiError'
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

  return useMutation<void, ApiError, string, { originalIsDeleted: boolean } | undefined>({
    mutationFn: (messageId) => deleteMessage(conversationId, messageId),
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey: messagesKey })

      // 삭제 대상 메시지의 is_deleted 값만 저장 — 다른 캐시 변경은 보존
      const cache = queryClient.getQueryData<InfiniteData<MessageListResponse>>(messagesKey)
      let originalIsDeleted: boolean | undefined
      for (const page of cache?.pages ?? []) {
        const msg = page.results.find(m => m.message_id === messageId)
        if (msg) { originalIsDeleted = msg.is_deleted; break }
      }

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

      return originalIsDeleted !== undefined ? { originalIsDeleted } : undefined
    },
    onSuccess: () => {
      // messages 리페치는 하지 않는다.
      // onMutate의 낙관적 업데이트(is_deleted: true)가 이미 UI를 반영했고,
      // 서버가 보내는 WebSocket message_deleted 이벤트가 동기화를 담당한다.
      // 즉시 invalidate → refetch하면 서버 응답이 낙관적 상태를 덮어써 메시지가 복구되는 문제가 생긴다.
      queryClient.invalidateQueries({ queryKey: queryKeys.dm.conversations, exact: true })
    },
    onError: (err, messageId, context) => {
      if (context !== undefined) {
        // 해당 메시지 하나만 원래 is_deleted 상태로 복구 — WebSocket으로 온 다른 변경은 보존
        queryClient.setQueryData<InfiniteData<MessageListResponse>>(messagesKey, (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map(page => ({
              ...page,
              results: page.results.map(m =>
                m.message_id === messageId ? { ...m, is_deleted: context.originalIsDeleted } : m
              ),
            })),
          }
        })
      }
      toast.error(getApiErrorMessage(err, { client: '메시지를 삭제할 수 없습니다.' }))
    },
  })
}
