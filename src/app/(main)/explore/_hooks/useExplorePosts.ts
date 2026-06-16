import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query'
import { getExplorePosts } from '@/lib/api/posts'
import { queryKeys } from '@/lib/queryKeys'
import type { ExploreResponse } from '@/types'

const PAGE_SIZE = 12

// seed: 탐색 피드가 랜덤 정렬일 때 페이지 간 동일한 순서를 유지하기 위해 첫 응답의 seed를 다음 요청에 그대로 전달
type ExplorePageParam = { cursor: string | null; seed?: number }

function extractCursor(nextUrl: string | null): string | null {
  if (!nextUrl) return null
  try {
    return new URL(nextUrl).searchParams.get('cursor')
  } catch {
    return null
  }
}

export function useExplorePosts(search: string, category: string) {
  const cat = category !== '전체' ? category : undefined
  return useInfiniteQuery<
    ExploreResponse,
    Error,
    InfiniteData<ExploreResponse>,
    ReturnType<typeof queryKeys.posts.explore>,
    ExplorePageParam
  >({
    queryKey: queryKeys.posts.explore(search || undefined, cat),
    queryFn: ({ pageParam }) =>
      getExplorePosts({
        search: search || undefined,
        category: cat,
        cursor: pageParam.cursor ?? undefined,
        seed: pageParam.seed,
        page_size: PAGE_SIZE,
      }),
    initialPageParam: { cursor: null, seed: undefined },
    getNextPageParam: (lastPage) => ({ cursor: extractCursor(lastPage.next), seed: lastPage.seed }),
    refetchOnWindowFocus: false,
  })
}
