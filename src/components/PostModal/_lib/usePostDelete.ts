'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { getApiErrorMessage } from '@/lib/apiError'
import { toast } from '@/store/toastStore'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/store/authStore'
import type { DetailResponse } from '@/types'

type UsePostDeleteOptions = {
  onClose: () => void
}

/**
 * 게시글 삭제(DELETE) mutation 훅.
 *
 * 성공 시 순서:
 *   1) 모달을 먼저 닫는다 — invalidate 전에 닫아 stale 데이터 리패치 시도를 방지.
 *   2) 성공 토스트.
 *   3) mainFeed / explore / 본인 프로필 캐시 무효화.
 */
export function usePostDelete(postId: string, options: UsePostDeleteOptions) {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.userId)
  const { onClose } = options

  const mutation = useMutation({
    mutationFn: () => apiClient.delete(`posts/${postId}`).json<DetailResponse>(),
    onSuccess: async () => {
      onClose()
      toast.success('게시글이 삭제되었습니다.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.posts.mainFeed }),
        queryClient.invalidateQueries({ queryKey: queryKeys.posts.exploreBase }),
        ...(userId ? [queryClient.invalidateQueries({ queryKey: queryKeys.users.profile(userId) })] : []),
      ])
    },
    onError: (err) => {
      console.error('게시글 삭제 실패:', err)
      toast.error(getApiErrorMessage(err, { client: '게시글 삭제에 실패했습니다.' }))
    },
  })

  return {
    deletePost: mutation.mutate,
    isDeleting: mutation.isPending,
  }
}
