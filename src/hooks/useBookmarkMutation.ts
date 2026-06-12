import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { getApiErrorMessage } from '@/lib/apiError'
import { toast } from '@/store/toastStore'
import type { BookmarkResponse } from '@/types'

interface UseBookmarkMutationOptions<TCacheData> {
  /** 북마크/취소 엔드포인트 경로. wasBookmarked=true 이면 DELETE, false 이면 POST를 호출한다. */
  buildEndpoint: () => string
  /** 옵티미스틱 업데이트 대상 쿼리 키 */
  queryKey: QueryKey
  /**
   * onMutate 시점에 캐시를 낙관적으로 수정하는 함수 (순수 함수).
   * old가 undefined이면 undefined를 반환해 캐시 없음을 유지한다.
   */
  optimisticUpdater: (old: TCacheData | undefined, wasBookmarked: boolean) => TCacheData | undefined
  /** onSuccess 시점에 서버 응답값으로 캐시를 정확화하는 함수. */
  successUpdater: (old: TCacheData | undefined, res: BookmarkResponse) => TCacheData | undefined
  /**
   * onSuccess 이후 다른 쿼리 키의 캐시를 동기화할 때 사용 (선택).
   * 피드 ↔ 모달 상세 캐시 간 북마크 상태를 동시에 반영하기 위해 사용한다.
   */
  onAfterSuccess?: (res: BookmarkResponse) => void
}

/**
 * 게시글 북마크 토글 공통 패턴.
 *
 * - wasBookmarked=true  → DELETE 요청 (북마크 취소)
 * - wasBookmarked=false → POST  요청 (북마크)
 * - useLikeMutation과 동일한 옵티미스틱 패턴:
 *   onMutate 즉시 반영 → onError 롤백 → onSuccess 서버값 동기화
 */
export function useBookmarkMutation<TCacheData>({
  buildEndpoint,
  queryKey,
  optimisticUpdater,
  successUpdater,
  onAfterSuccess,
}: UseBookmarkMutationOptions<TCacheData>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (wasBookmarked: boolean) => {
      const endpoint = buildEndpoint()
      return wasBookmarked
        ? apiClient.delete(endpoint).json<BookmarkResponse>()
        : apiClient.post(endpoint).json<BookmarkResponse>()
    },
    onMutate: async (wasBookmarked) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<TCacheData>(queryKey)
      queryClient.setQueryData<TCacheData>(queryKey, (old) => optimisticUpdater(old, wasBookmarked))
      return { previous }
    },
    onError: (err, _wasBookmarked, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKey, context.previous)
      }
      toast.error(getApiErrorMessage(err, { client: '잠시 후 다시 시도해주세요.' }))
    },
    onSuccess: (res) => {
      queryClient.setQueryData<TCacheData>(queryKey, (old) => successUpdater(old, res))
      onAfterSuccess?.(res)
    },
  })
}
