import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { queryKeys } from '@/lib/queryKeys'
import type { CommentsListResponse } from '@/types'

export function useCommentsQuery(postId: string) {
  return useQuery({
    queryKey: queryKeys.comments.list(postId),
    queryFn: () =>
      apiClient
        .get('comments', { searchParams: { post_id: postId, page: 1, page_size: 20 } })
        .json<CommentsListResponse>(),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}
