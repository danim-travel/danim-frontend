import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { LikeResponse } from '@/types'

interface UseLikeMutationOptions<TCacheData, TVariables extends { wasLiked: boolean }> {
  /**
   * 좋아요/취소 엔드포인트의 베이스 경로.
   * wasLiked=true 이면 DELETE, false 이면 POST 를 호출한다.
   * 예) `posts/${postId}/like`, `comments/${commentId}/like`
   */
  buildEndpoint: (variables: TVariables) => string
  /** 옵티미스틱 업데이트 대상 쿼리 키 */
  queryKey: QueryKey
  /**
   * onMutate 시점에 캐시 데이터를 낙관적으로 수정하는 함수 (순수 함수).
   * 인자로 전달된 `old` 가 undefined 이면 undefined 를 반환한다.
   */
  optimisticUpdater: (old: TCacheData | undefined, variables: TVariables) => TCacheData | undefined
  /**
   * onSuccess 시점에 서버 응답값으로 캐시 데이터를 정확화하는 함수.
   */
  successUpdater: (old: TCacheData | undefined, res: LikeResponse, variables: TVariables) => TCacheData | undefined
  /**
   * 캐시 업데이트 직전에 실행하는 사이드 이펙트 콜백 (선택).
   * pendingId 등록 등 onMutate 전용 처리에 사용한다.
   */
  onBeforeMutate?: (variables: TVariables) => void
  /**
   * 성공/실패 여부와 무관하게 mutation 완료 후 실행하는 콜백 (선택).
   * pendingId 정리 등 cleanup에 사용한다.
   */
  onSettled?: (variables: TVariables) => void
}

/**
 * 게시글·댓글 좋아요 토글 공통 패턴.
 *
 * - wasLiked=true  → DELETE 요청 (좋아요 취소)
 * - wasLiked=false → POST  요청 (좋아요)
 * - 표준 옵티미스틱 패턴: onMutate 즉시 반영 → onError 롤백 → onSuccess 서버값 동기화
 *
 * 호출처에서 엔드포인트와 캐시 업데이트 함수만 주입하면 된다.
 */
export function useLikeMutation<TCacheData, TVariables extends { wasLiked: boolean } = { wasLiked: boolean }>({
  buildEndpoint,
  queryKey,
  optimisticUpdater,
  successUpdater,
  onBeforeMutate,
  onSettled,
}: UseLikeMutationOptions<TCacheData, TVariables>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (variables: TVariables) => {
      const endpoint = buildEndpoint(variables)
      return variables.wasLiked
        ? apiClient.delete(endpoint).json<LikeResponse>()
        : apiClient.post(endpoint).json<LikeResponse>()
    },
    onMutate: async (variables) => {
      onBeforeMutate?.(variables)
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<TCacheData>(queryKey)
      queryClient.setQueryData<TCacheData>(queryKey, (old) => optimisticUpdater(old, variables))
      return { previous }
    },
    onError: (_err, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },
    onSuccess: (res, variables) => {
      queryClient.setQueryData<TCacheData>(queryKey, (old) => successUpdater(old, res, variables))
    },
    onSettled: (_res, _err, variables) => {
      onSettled?.(variables)
    },
  })
}
