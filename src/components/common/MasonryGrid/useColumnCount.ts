'use client'

import { useSyncExternalStore } from 'react'

export type ColumnCount = 2 | 3 | 4

// Tailwind 기본 브레이크포인트와 같은 값을 써야 그리드 클래스와 어긋나지 않는다.
const MD = '(min-width: 768px)'
const LG = '(min-width: 1024px)'

function subscribe(onStoreChange: () => void) {
  const queries = [window.matchMedia(MD), window.matchMedia(LG)]
  queries.forEach((q) => q.addEventListener('change', onStoreChange))
  return () => queries.forEach((q) => q.removeEventListener('change', onStoreChange))
}

function getSnapshot(): ColumnCount {
  if (window.matchMedia(LG).matches) return 4
  if (window.matchMedia(MD).matches) return 3
  return 2
}

/**
 * 서버에는 뷰포트가 없다. 데스크탑을 가정하면 모바일 기기에서 4열로 한 번 그렸다가
 * 2열로 바뀌며 튀므로, 좁은 쪽을 기준으로 시작한다.
 */
function getServerSnapshot(): ColumnCount {
  return 2
}

/**
 * 현재 뷰포트의 마소너리 컬럼 수.
 *
 * CSS 브레이크포인트만으로는 JS가 컬럼 수를 알 수 없는데,
 * 컬럼 분배를 JS로 하려면 분배 로직과 그리드 클래스가 같은 값을 봐야 한다.
 */
export function useColumnCount(): ColumnCount {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
