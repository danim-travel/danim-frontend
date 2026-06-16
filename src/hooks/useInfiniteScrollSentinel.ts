import { useEffect, useRef } from 'react'

interface Options {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onLoadMore: () => void
  rootMargin?: string
}

/**
 * IntersectionObserver 기반 무한 스크롤 sentinel 훅.
 * 반환된 ref를 sentinel 엘리먼트(h-1 div 등)에 붙이면
 * 뷰포트에 진입 시 onLoadMore를 호출한다.
 */
export function useInfiniteScrollSentinel({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  rootMargin = '200px',
}: Options) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = sentinelRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          onLoadMore()
        }
      },
      { root: null, rootMargin, threshold: 0 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [onLoadMore, hasNextPage, isFetchingNextPage, rootMargin])

  return sentinelRef
}
