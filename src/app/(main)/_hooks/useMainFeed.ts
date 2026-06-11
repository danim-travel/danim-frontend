import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { queryKeys } from '@/lib/queryKeys'
import type { MainFeedResponse } from '@/types'

function extractCursor(nextUrl: string | null): string | null {
  if (!nextUrl) return null
  try {
    return new URL(nextUrl).searchParams.get('cursor')
  } catch {
    return null
  }
}

export function useMainFeed() {
  return useInfiniteQuery<
    MainFeedResponse,
    Error,
    InfiniteData<MainFeedResponse>,
    typeof queryKeys.posts.mainFeed,
    string | null
  >({
    queryKey: queryKeys.posts.mainFeed,
    queryFn: ({ pageParam }) => {
      const searchParams = pageParam ? { cursor: pageParam } : undefined
      return apiClient.get('posts/main', { searchParams }).json<MainFeedResponse>()
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => extractCursor(lastPage.next),
    refetchOnWindowFocus: false,
  })
}
