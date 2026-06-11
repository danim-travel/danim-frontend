import type { InfiniteData } from '@tanstack/react-query'
import type { MainFeedItem, MainFeedResponse } from '@/types'

/** 메인 피드 무한 쿼리 캐시 타입 */
export type FeedCache = InfiniteData<MainFeedResponse>

/**
 * 무한 피드 캐시에서 특정 게시글 하나를 불변 업데이트한다.
 *
 * old가 undefined(캐시 미적재)이면 그대로 반환해 캐시를 건드리지 않는다.
 * queryClient.setQueryData 콜백 안에서 사용하도록 설계되었다.
 */
export function updateFeedItem(
  old: FeedCache | undefined,
  postId: string,
  updater: (item: MainFeedItem) => MainFeedItem,
): FeedCache | undefined {
  if (!old) return old
  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      results: page.results.map((item) =>
        item.post.post_id === postId ? updater(item) : item
      ),
    })),
  }
}
