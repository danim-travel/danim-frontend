import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { apiClient } from '@/lib/apiClient'
import { queryKeys } from '@/lib/queryKeys'
import type { PostDetail } from '@/types'

export function usePrefetchPostDetail() {
  const queryClient = useQueryClient()

  return useCallback((postId: string) => {
    // staleTime 지정 — hover 마다 동일 게시글 prefetch가 네트워크 폭주를 일으키지 않도록
    // 30초 이내 캐시가 있으면 재요청하지 않는다.
    queryClient.prefetchQuery({
      queryKey: queryKeys.posts.detail(postId),
      queryFn: () => apiClient.get(`posts/${postId}`).json<PostDetail>(),
      staleTime: 30 * 1000,
    })
  }, [queryClient])
}
