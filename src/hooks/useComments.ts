import { useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { queryKeys } from '@/lib/queryKeys'
import { useLikeMutation } from '@/hooks/useLikeMutation'
import type {
  CommentsListResponse,
  CommentCreateRequest,
  CommentCreateResponse,
  CommentUpdateRequest,
  CommentUpdateResponse,
  CommentPresignedUrlRequest,
  CommentPresignedUrlResponse,
  PostDetail,
} from '@/types'

/**
 * 댓글 조회 + 생성/수정/삭제/좋아요 mutation.
 * @see usePostDetail — 동일한 표준 옵티미스틱 패턴 사용.
 *
 * 댓글 좋아요는 mutation이 댓글들 간 공유되므로 `mutation.isPending`만으로는
 * 동일 댓글 연속 클릭을 막을 수 없다. `toggleCommentLike`를 통해 hook 내부에서 가드한다.
 */
export function useComments(postId: string) {
  const queryClient = useQueryClient()
  const commentsKey = queryKeys.comments.list(postId)
  const postDetailKey = queryKeys.posts.detail(postId)
  const pendingLikeIdsRef = useRef<Set<string>>(new Set())

  const query = useQuery({
    queryKey: commentsKey,
    queryFn: () =>
      apiClient
        .get('v1/comments', { searchParams: { post_id: postId, page: 1, page_size: 20 } })
        .json<CommentsListResponse>(),
    refetchOnWindowFocus: false,
  })

  const createMutation = useMutation({
    mutationFn: (payload: Omit<CommentCreateRequest, 'post_id'>) =>
      apiClient
        .post('v1/comments', { json: { post_id: postId, ...payload } })
        .json<CommentCreateResponse>(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: postDetailKey })
      await queryClient.cancelQueries({ queryKey: commentsKey })
      const previousDetail = queryClient.getQueryData<PostDetail>(postDetailKey)
      const previousComments = queryClient.getQueryData<CommentsListResponse>(commentsKey)
      queryClient.setQueryData<PostDetail>(postDetailKey, (old) => {
        if (!old) return old
        return { ...old, comment_count: old.comment_count + 1 }
      })
      return { previousDetail, previousComments }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousDetail) queryClient.setQueryData(postDetailKey, context.previousDetail)
      if (context?.previousComments) queryClient.setQueryData(commentsKey, context.previousComments)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentsKey })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ commentId, ...payload }: { commentId: string } & CommentUpdateRequest) =>
      apiClient.patch(`v1/comments/${commentId}`, { json: payload }).json<CommentUpdateResponse>(),
    onMutate: async ({ commentId, content }) => {
      await queryClient.cancelQueries({ queryKey: commentsKey })
      const previous = queryClient.getQueryData<CommentsListResponse>(commentsKey)
      queryClient.setQueryData<CommentsListResponse>(commentsKey, (old) => {
        if (!old) return old
        return {
          ...old,
          results: old.results.map((c) =>
            c.comment_id === commentId
              ? { ...c, content: content ?? c.content, updated_at: new Date().toISOString() }
              : c
          ),
        }
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(commentsKey, context.previous)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentsKey })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (commentId: string): Promise<void> => {
      await apiClient.delete(`v1/comments/${commentId}`)
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: postDetailKey })
      const previous = queryClient.getQueryData<PostDetail>(postDetailKey)
      queryClient.setQueryData<PostDetail>(postDetailKey, (old) => {
        if (!old) return old
        return { ...old, comment_count: Math.max(0, old.comment_count - 1) }
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(postDetailKey, context.previous)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentsKey })
    },
  })

  const likeMutation = useLikeMutation<CommentsListResponse, { commentId: string; wasLiked: boolean }>({
    buildEndpoint: ({ commentId }) => `v1/comments/${commentId}/like`,
    queryKey: commentsKey,
    onBeforeMutate: ({ commentId }) => {
      pendingLikeIdsRef.current.add(commentId)
    },
    optimisticUpdater: (old, { commentId, wasLiked }) => {
      if (!old) return old
      return {
        ...old,
        results: old.results.map((c) =>
          c.comment_id === commentId
            ? { ...c, is_liked: !wasLiked, like_count: c.like_count + (wasLiked ? -1 : 1) }
            : c
        ),
      }
    },
    successUpdater: (old, res, { commentId }) => {
      if (!old) return old
      return {
        ...old,
        results: old.results.map((c) =>
          c.comment_id === commentId ? { ...c, is_liked: res.is_liked, like_count: res.like_count } : c
        ),
      }
    },
    onSettled: ({ commentId }) => {
      pendingLikeIdsRef.current.delete(commentId)
    },
  })

  const presignedUrlMutation = useMutation({
    mutationFn: (payload: CommentPresignedUrlRequest) =>
      apiClient
        .post('v1/comments/presigned-url', { json: payload })
        .json<CommentPresignedUrlResponse>(),
  })

  /**
   * 댓글 좋아요 토글. 동일 댓글에 대한 요청이 in-flight 중이면 호출을 무시한다.
   * 호출자는 별도 가드 없이 사용 가능.
   */
  const toggleCommentLike = useCallback(
    (commentId: string, wasLiked: boolean) => {
      if (pendingLikeIdsRef.current.has(commentId)) return
      likeMutation.mutate({ commentId, wasLiked })
    },
    [likeMutation]
  )

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    createMutation,
    updateMutation,
    deleteMutation,
    likeMutation,
    toggleCommentLike,
    presignedUrlMutation,
  }
}
