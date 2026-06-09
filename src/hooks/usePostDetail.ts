import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { queryKeys } from '@/lib/queryKeys'
import { useLikeMutation } from '@/hooks/useLikeMutation'
import type { BookmarkResponse, PostDetail } from '@/types'

/**
 * 게시글 상세 조회 + 좋아요/북마크 mutation.
 *
 * 표준 옵티미스틱 업데이트 패턴:
 *   1. onMutate  — 즉시 queryCache 토글 (사용자 즉시 피드백)
 *   2. onError   — context.previous 로 롤백 (실패 시 복구)
 *   3. onSuccess — 서버값으로 정확화 (카운트 동기화)
 *
 * 빠른 연속 호출 방지는 호출자가 `mutation.isPending` 으로 가드.
 */
export function usePostDetail(postId: string) {
  const queryClient = useQueryClient()
  const detailKey = queryKeys.posts.detail(postId)

  const query = useQuery({
    queryKey: detailKey,
    queryFn: () => apiClient.get(`posts/${postId}`).json<PostDetail>(),
    refetchOnWindowFocus: false,
  })

  const likeMutation = useLikeMutation<PostDetail>({
    buildEndpoint: () => `posts/${postId}/like`,
    queryKey: detailKey,
    optimisticUpdater: (old, { wasLiked }) => {
      if (!old) return old
      return { ...old, is_liked: !wasLiked, like_count: old.like_count + (wasLiked ? -1 : 1) }
    },
    successUpdater: (old, res) => {
      if (!old) return old
      return { ...old, is_liked: res.is_liked, like_count: res.like_count }
    },
  })

  const bookmarkMutation = useMutation({
    mutationFn: (wasBookmarked: boolean) =>
      wasBookmarked
        ? apiClient.delete(`posts/${postId}/bookmark`).json<BookmarkResponse>()
        : apiClient.post(`posts/${postId}/bookmark`).json<BookmarkResponse>(),
    onMutate: async (wasBookmarked) => {
      await queryClient.cancelQueries({ queryKey: detailKey })
      const previous = queryClient.getQueryData<PostDetail>(detailKey)
      queryClient.setQueryData<PostDetail>(detailKey, (old) => {
        if (!old) return old
        return { ...old, is_bookmarked: !wasBookmarked }
      })
      return { previous }
    },
    onError: (_err, _wasBookmarked, context) => {
      if (context?.previous) queryClient.setQueryData(detailKey, context.previous)
    },
    onSuccess: (res) => {
      queryClient.setQueryData<PostDetail>(detailKey, (old) => {
        if (!old) return old
        return { ...old, is_bookmarked: res.is_bookmarked }
      })
    },
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    likeMutation,
    bookmarkMutation,
  }
}
