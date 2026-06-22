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
  /**
   * 인터셉트 모달 등 onClose만으로는 페이지 정리가 부족한 경우 명시적 후처리.
   * (예: backThenPush로 진입 페이지로 이동) onClose 직후 호출된다.
   */
  onAfterDelete?: () => void
}

/**
 * 게시글 삭제(DELETE) mutation 훅.
 *
 * 성공 시 순서:
 *   1) 모달을 먼저 닫는다 — invalidate 전에 닫아 stale 데이터 리패치 시도를 방지.
 *   2) onAfterDelete 후처리 (선택).
 *   3) 성공 토스트.
 *   4) mainFeed / explore / bookmarks / 본인 프로필 캐시 무효화.
 */
export function usePostDelete(postId: string, options: UsePostDeleteOptions) {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.userId)
  const { onClose, onAfterDelete } = options

  const mutation = useMutation({
    mutationFn: () => apiClient.delete(`posts/${postId}`).json<DetailResponse>(),
    onSuccess: async () => {
      onClose()
      onAfterDelete?.()
      toast.success('게시글이 삭제되었습니다.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.posts.mainFeed }),
        queryClient.invalidateQueries({ queryKey: queryKeys.posts.exploreBase }),
        queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.all }),
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
