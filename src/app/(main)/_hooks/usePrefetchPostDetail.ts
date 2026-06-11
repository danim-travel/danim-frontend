import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { apiClient } from '@/lib/apiClient'
import { queryKeys } from '@/lib/queryKeys'
import type { PostDetail } from '@/types'

export function usePrefetchPostDetail() {
  const queryClient = useQueryClient()

  return useCallback((postId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.posts.detail(postId),
      queryFn: () => apiClient.get(`posts/${postId}`).json<PostDetail>(),
    })
  }, [queryClient])
}
