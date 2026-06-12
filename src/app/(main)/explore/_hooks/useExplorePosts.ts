import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query'
import { getExplorePosts } from '@/lib/api/posts'
import { queryKeys } from '@/lib/queryKeys'
import type { ExploreResponse } from '@/types'

const PAGE_SIZE = 12

function extractCursor(nextUrl: string | null): string | null {
  if (!nextUrl) return null
  try {
    return new URL(nextUrl).searchParams.get('cursor')
  } catch {
    return null
  }
}

export function useExplorePosts(search: string) {
  return useInfiniteQuery<
    ExploreResponse,
    Error,
    InfiniteData<ExploreResponse>,
    ReturnType<typeof queryKeys.posts.explore>,
    string | null
  >({
    queryKey: queryKeys.posts.explore(search || undefined),
    queryFn: ({ pageParam }) =>
      getExplorePosts({
        search: search || undefined,
        cursor: pageParam ?? undefined,
        page_size: PAGE_SIZE,
      }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => extractCursor(lastPage.next),
    refetchOnWindowFocus: false,
  })
}
