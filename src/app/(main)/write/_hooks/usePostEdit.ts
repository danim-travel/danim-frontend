'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { getApiErrorMessage } from '@/lib/apiError'
import { toast } from '@/store/toastStore'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/store/authStore'
import type { CreatePostRequest, DetailResponse } from '@/types'

/**
 * 게시글 수정(PATCH) mutation 훅.
 *
 * 작성(POST)과 동일한 전체 payload를 보낸다.
 * 성공 시 detail / mainFeed / explore / 본인 프로필 캐시를 무효화한다.
 */
export function usePostEdit(postId: string) {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.userId)

  const mutation = useMutation({
    mutationFn: (payload: CreatePostRequest) =>
      apiClient.patch(`posts/${postId}`, { json: payload }).json<DetailResponse>(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.posts.mainFeed }),
        queryClient.invalidateQueries({ queryKey: queryKeys.posts.exploreBase }),
        ...(userId ? [queryClient.invalidateQueries({ queryKey: queryKeys.users.profile(userId) })] : []),
      ])
    },
    onError: (err) => {
      console.error('게시글 수정 실패:', err)
      toast.error(getApiErrorMessage(err, { client: '게시글 수정에 실패했습니다.' }))
    },
  })

  return {
    editPost: mutation.mutateAsync,
    isEditing: mutation.isPending,
  }
}
