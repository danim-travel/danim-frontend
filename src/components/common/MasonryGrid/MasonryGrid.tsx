'use client'

import type { CSSProperties, KeyboardEvent, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { distributeByHeight } from './distribute'
import { useColumnCount, type ColumnCount } from './useColumnCount'

// Tailwind는 런타임에 조합된 클래스명을 인식하지 못한다. 정적 맵이어야 JIT가 잡는다.
const GRID_COLS: Record<ColumnCount, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
}

export interface MasonryGridProps<T> {
  items: T[]
  /** 카드의 가로세로 비율(width / height). `cardRatio()` 결과를 넘긴다. */
  getRatio: (item: T) => number
  getKey: (item: T) => string
  /**
   * 카드 내부만 그린다.
   * 비율 상자·모서리·배경·클릭·`group`은 MasonryGrid가 담당하므로,
   * 여기서는 `<GridImage>`나 `absolute inset-0` 오버레이처럼 칸을 채우는 요소만 반환한다.
   */
  renderItem: (item: T, index: number) => ReactNode
  onItemClick?: (item: T) => void
  onItemHover?: (item: T) => void
  /** 컨테이너에 붙일 data-testid */
  testId?: string
  /** 각 카드에 붙일 data-* 속성. e2e 선택자와 스크롤 복원(`[data-post-id]`)에 쓰인다. */
  getItemAttrs?: (item: T) => Record<`data-${string}`, string>
  className?: string
}

/**
 * 컬럼 분배를 JS로 수행하는 마소너리 그리드.
 *
 * `columns-*`(CSS 다단)를 쓰지 않는 이유는 `distribute.ts` 주석 참고 — 요약하면
 * CSS 다단은 아이템이 추가될 때마다 전체 컬럼 경계를 다시 계산해서
 * 무한스크롤 중 이미 보고 있던 카드가 다른 컬럼으로 밀린다. (#275)
 */
export function MasonryGrid<T>({
  items,
  getRatio,
  getKey,
  renderItem,
  onItemClick,
  onItemHover,
  testId,
  getItemAttrs,
  className,
}: MasonryGridProps<T>) {
  const columnCount = useColumnCount()
  // 렌더(aspect-ratio)와 분배(높이 계산)가 같은 값을 봐야 컬럼 바닥이 맞는다.
  // 한 번만 계산해서 양쪽에 쓴다.
  const ratios = items.map(getRatio)
  const columns = distributeByHeight(ratios, columnCount)

  return (
    <div data-testid={testId} className={cn('grid items-start gap-3', GRID_COLS[columnCount], className)}>
      {columns.map((indexes, columnIndex) => (
        <div key={columnIndex} className="flex flex-col gap-3">
          {indexes.map((index) => {
            const item = items[index]
            return (
              <div
                {...getItemAttrs?.(item)}
                key={getKey(item)}
                style={{ '--card-ratio': ratios[index] } as CSSProperties}
                className={cn(
                  'group relative aspect-(--card-ratio) overflow-hidden rounded-xl bg-bg-subtle',
                  onItemClick &&
                    'cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(color:--color-border-focus)',
                )}
                // div에 onClick만 달면 키보드 사용자는 게시글을 열 수 없다.
                // 클릭 가능할 때만 버튼 시맨틱을 부여한다.
                role={onItemClick && 'button'}
                tabIndex={onItemClick && 0}
                onClick={onItemClick && (() => onItemClick(item))}
                onKeyDown={
                  onItemClick &&
                  ((e: KeyboardEvent<HTMLDivElement>) => {
                    if (e.key !== 'Enter' && e.key !== ' ') return
                    e.preventDefault() // Space 스크롤 방지
                    onItemClick(item)
                  })
                }
                onMouseEnter={onItemHover && (() => onItemHover(item))}
              >
                {renderItem(item, index)}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default MasonryGrid
