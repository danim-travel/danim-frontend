import { useCallback, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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

export function useCommentMutations(postId: string) {
  const queryClient = useQueryClient()
  const commentsKey = queryKeys.comments.list(postId)
  const postDetailKey = queryKeys.posts.detail(postId)
  const pendingLikeIdsRef = useRef<Set<string>>(new Set())

  const createMutation = useMutation({
    mutationFn: (payload: Omit<CommentCreateRequest, 'post_id'>) =>
      apiClient
        .post('v1/comments', { json: { post_id: postId, ...payload } })
        .json<CommentCreateResponse>(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: postDetailKey })
      await queryClient.cancelQueries({ queryKey: commentsKey })
      const previousDetail = queryClient.getQueryData<PostDetail>(postDetailKey)
      queryClient.setQueryData<PostDetail>(postDetailKey, (old) => {
        if (!old) return old
        return { ...old, comment_count: old.comment_count + 1 }
      })
      return { previousDetail }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousDetail) queryClient.setQueryData(postDetailKey, context.previousDetail)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentsKey })
      queryClient.invalidateQueries({ queryKey: postDetailKey })
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
      await queryClient.cancelQueries({ queryKey: commentsKey })
      const previousDetail = queryClient.getQueryData<PostDetail>(postDetailKey)
      const previousComments = queryClient.getQueryData<CommentsListResponse>(commentsKey)
      queryClient.setQueryData<PostDetail>(postDetailKey, (old) => {
        if (!old) return old
        return { ...old, comment_count: Math.max(0, old.comment_count - 1) }
      })
      return { previousDetail, previousComments }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousDetail) queryClient.setQueryData(postDetailKey, context.previousDetail)
      if (context?.previousComments) queryClient.setQueryData(commentsKey, context.previousComments)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentsKey })
      queryClient.invalidateQueries({ queryKey: postDetailKey })
    },
  })

  const likeMutation = useLikeMutation<CommentsListResponse, { commentId: string; wasLiked: boolean }>({
    buildEndpoint: ({ commentId }) => `v1/comments/${commentId}/like`,
    queryKey: commentsKey,
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

  const { mutate: likeMutate } = likeMutation
  const toggleCommentLike = useCallback(
    (commentId: string, wasLiked: boolean) => {
      if (pendingLikeIdsRef.current.has(commentId)) return
      pendingLikeIdsRef.current.add(commentId)
      likeMutate({ commentId, wasLiked })
    },
    [likeMutate]
  )

  const { mutate: updateMutate } = updateMutation
  const onUpdateComment = useCallback(
    (commentId: string, content: string) => updateMutate({ commentId, content }),
    [updateMutate]
  )

  const { mutate: deleteMutate } = deleteMutation
  const onDeleteComment = useCallback(
    (commentId: string) => deleteMutate(commentId),
    [deleteMutate]
  )

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    likeMutation,
    toggleCommentLike,
    onUpdateComment,
    onDeleteComment,
    presignedUrlMutation,
  }
}
