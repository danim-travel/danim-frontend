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
  // postId가 포함된 페이지만 찾아 갱신 — 나머지 페이지는 참조 유지로 리렌더 절감
  const targetPageIdx = old.pages.findIndex((page) =>
    page.results.some((item) => item.post.post_id === postId),
  )
  if (targetPageIdx === -1) return old
  const targetPage = old.pages[targetPageIdx]
  const updatedPage = {
    ...targetPage,
    results: targetPage.results.map((item) =>
      item.post.post_id === postId ? updater(item) : item,
    ),
  }
  const pages = old.pages.slice()
  pages[targetPageIdx] = updatedPage
  return { ...old, pages }
}
