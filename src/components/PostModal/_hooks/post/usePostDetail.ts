import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { queryKeys } from '@/lib/queryKeys'
import { useLikeMutation } from '@/hooks/interactions/useLikeMutation'
import { useBookmarkMutation } from '@/hooks/interactions/useBookmarkMutation'
import { updateFeedItem, type FeedCache } from '@/lib/feedCache'
import type { PostDetail } from '@/types'

/**
 * 게시글 상세 데이터 조회 + 좋아요/북마크 mutation.
 *
 * 좋아요·북마크 모두 옵티미스틱 업데이트를 적용한다.
 *   1. onMutate  — 즉시 캐시 토글 (사용자 즉시 피드백)
 *   2. onError   — 이전 캐시로 롤백 (실패 시 복구)
 *   3. onSuccess — 서버 응답값으로 정확화 (카운트 동기화)
 *
 * onAfterSuccess에서 mainFeed 캐시도 함께 갱신해 피드 카드와 모달의 상태를 동기화한다.
 * 빠른 연속 클릭 방지는 호출자가 `mutation.isPending`으로 가드한다.
 */
export function usePostDetail(postId: string) {
  const queryClient = useQueryClient()
  const detailKey = queryKeys.posts.detail(postId)

  const query = useQuery({
    queryKey: detailKey,
    queryFn: () => apiClient.get(`posts/${postId}`).json<PostDetail>(),
    refetchOnWindowFocus: false,
  })

  const feedKey = queryKeys.posts.mainFeed

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
    onAfterSuccess: (res) => {
      queryClient.setQueryData<FeedCache>(feedKey, (old) =>
        updateFeedItem(old, postId, (item) => ({
          ...item,
          is_liked: res.is_liked,
          like_count: res.like_count,
        }))
      )
    },
  })

  const bookmarkMutation = useBookmarkMutation<PostDetail>({
    buildEndpoint: () => `posts/${postId}/bookmark`,
    queryKey: detailKey,
    optimisticUpdater: (old, wasBookmarked) => {
      if (!old) return old
      return { ...old, is_bookmarked: !wasBookmarked }
    },
    successUpdater: (old, res) => {
      if (!old) return old
      return { ...old, is_bookmarked: res.is_bookmarked }
    },
    // 피드 캐시도 함께 동기화 — 모달에서 북마크 시 피드 카드에 즉시 반영
    onAfterSuccess: (res) => {
      queryClient.setQueryData<FeedCache>(feedKey, (old) =>
        updateFeedItem(old, postId, (item) => ({
          ...item,
          is_bookmarked: res.is_bookmarked,
        }))
      )
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
