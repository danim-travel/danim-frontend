/**
 * 알림 도메인 훅 모음.
 *
 * - useNotificationsQuery       : 알림 목록(cursor 기반 무한스크롤)
 * - useMarkNotificationRead     : 개별 읽음 처리 (409 = 이미 읽음, 조용히 무시)
 * - useMarkAllNotificationsRead : 전체 읽음 처리
 * - useDeleteNotification       : 개별 삭제
 * - useDeleteAllNotifications   : 전체 삭제
 * - useCreateOrGetConversation  : DM 알림 클릭 시 대화방 진입 (POST /v1/conversations)
 */
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { queryKeys } from '@/lib/queryKeys'
import { getApiErrorMessage, isApiError } from '@/lib/apiError'
import { toast } from '@/store/toastStore'
import type { NotificationListResponse } from '@/types'

const PAGE_SIZE = 10

export function useNotificationsQuery(enabled: boolean = true) {
  return useInfiniteQuery<
    NotificationListResponse,
    Error,
    InfiniteData<NotificationListResponse>,
    typeof queryKeys.notifications.list,
    string | null
  >({
    queryKey: queryKeys.notifications.list,
    queryFn: ({ pageParam }) => {
      const searchParams: Record<string, string | number> = { page_size: PAGE_SIZE }
      if (pageParam) searchParams.cursor = pageParam
      return apiClient
        .get('notifications', { searchParams })
        .json<NotificationListResponse>()
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.next,
    refetchOnWindowFocus: false,
    enabled,
  })
}

interface MarkReadResponse {
  notification_id: string
  is_read: boolean
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) =>
      apiClient
        .patch(`notifications/${notificationId}`)
        .json<MarkReadResponse>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list })
    },
    onError: (err) => {
      // 409(이미 읽음)는 조용히 무시
      if (isApiError(err) && err.status === 409) return
      toast.error(getApiErrorMessage(err, { client: '읽음 처리에 실패했습니다.' }))
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      apiClient.patch('notifications').json<{ message: string }>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list })
    },
    onError: (err) => {
      toast.error(
        getApiErrorMessage(err, { client: '전체 읽음 처리에 실패했습니다.' }),
      )
    },
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) =>
      apiClient
        .delete(`notifications/${notificationId}`)
        .json<{ notification_id: string }>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list })
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, { client: '삭제에 실패했습니다.' }))
    },
  })
}

export function useDeleteAllNotifications() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      apiClient.delete('notifications').json<{ message: string }>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list })
    },
    onError: (err) => {
      toast.error(
        getApiErrorMessage(err, { client: '전체 삭제에 실패했습니다.' }),
      )
    },
  })
}

interface ConversationResponse {
  conversation_id: string
}

export function useCreateOrGetConversation() {
  return useMutation({
    mutationFn: (receiverId: string) =>
      apiClient
        .post('conversations', { json: { receiver_id: receiverId } })
        .json<ConversationResponse>(),
    onError: (err) => {
      toast.error(
        getApiErrorMessage(err, { client: '대화방을 열 수 없습니다.' }),
      )
    },
  })
}
