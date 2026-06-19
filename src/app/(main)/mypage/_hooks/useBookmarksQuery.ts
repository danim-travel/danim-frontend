import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query'
import { getBookmarks } from '@/lib/api/posts'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/store/authStore'
import type { BookmarkListResponse } from '@/types'

function extractCursor(nextUrl: string | null): string | null {
  if (!nextUrl) return null
  try {
    return new URL(nextUrl).searchParams.get('cursor')
  } catch {
    // 백엔드가 path/cursor만 줄 수 있으니 fallback으로 그대로 사용
    return nextUrl
  }
}

interface UseBookmarksQueryOptions {
  enabled?: boolean
}

/**
 * 마이페이지 "저장됨" 탭 — 내 북마크 게시글 cursor 페이징.
 *
 * - 비로그인이거나 상위에서 enabled=false 일 때는 호출하지 않는다.
 * - 응답 next URL에서 cursor를 추출해 다음 페이지를 요청한다.
 */
export function useBookmarksQuery(options: UseBookmarksQueryOptions = {}) {
  const { enabled = true } = options
  const accessToken = useAuthStore((s) => s.accessToken)

  return useInfiniteQuery<
    BookmarkListResponse,
    Error,
    InfiniteData<BookmarkListResponse>,
    typeof queryKeys.bookmarks.list,
    string | null
  >({
    queryKey: queryKeys.bookmarks.list,
    queryFn: ({ pageParam }) => getBookmarks({ cursor: pageParam ?? undefined }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => extractCursor(lastPage.next),
    refetchOnWindowFocus: false,
    enabled: enabled && !!accessToken,
  })
}
