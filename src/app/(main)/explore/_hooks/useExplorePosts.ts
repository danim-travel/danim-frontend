import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query'
import { getExplorePosts } from '@/lib/api/posts'
import { queryKeys } from '@/lib/queryKeys'
import type { ExploreResponse } from '@/types'

const PAGE_SIZE = 12

/**
 * 탐색 페이지 무한 스크롤.
 *
 * - 검색 모드(search 있음): cursor = post_id 기반 Base64 cursor. seed 미사용.
 * - 추천 피드 모드(search 없음): cursor = page number(int). 무작위 정렬 유지를 위해
 *   첫 응답에서 받은 seed를 저장해 다음 페이지마다 동일하게 전달한다.
 *
 * 두 모드 모두 다음 페이지 cursor는 백엔드가 내려준 `next` URL에서 추출하므로,
 * cursor 형식(Base64 / page number)에 관계없이 동일한 로직으로 동작한다.
 */
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
    // next가 없으면 undefined를 반환해야 hasNextPage가 false가 된다.
    // (truthy 객체를 반환하면 마지막 페이지에서도 계속 fetch되어 무한 루프 발생)
    getNextPageParam: (lastPage) => {
      const cursor = extractCursor(lastPage.next)
      if (!cursor) return undefined
      return { cursor, seed: lastPage.seed }
    },
    refetchOnWindowFocus: false,
  })
}
