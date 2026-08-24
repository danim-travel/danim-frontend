/**
 * 아이템을 컬럼별로 나눈다. 매 단계에서 "지금 가장 낮은 컬럼"에 넣는다.
 *
 * i번째 아이템의 위치가 0~i-1번만 보고 결정되므로 **append-only가 보장된다.**
 * 무한스크롤로 뒤에 아이템이 붙어도 앞쪽 배치는 절대 바뀌지 않는다.
 *
 * CSS 다단(`columns-*`)에는 이 성질이 없다. 컨테이너 높이가 auto면
 * `column-fill: balance`가 전체 콘텐츠 높이를 컬럼 수로 나눠 재분배하므로,
 * 다음 페이지가 붙을 때마다 이미 보고 있던 카드가 다른 컬럼으로 밀렸다. (#275)
 *
 * @param ratios 각 아이템의 가로세로 비율(width / height)
 * @param columnCount 컬럼 수
 * @returns 컬럼별 아이템 인덱스 배열
 */
export function distributeByHeight(ratios: number[], columnCount: number): number[][] {
  if (columnCount < 1) return []

  const columns: number[][] = Array.from({ length: columnCount }, () => [])
  const heights = new Array<number>(columnCount).fill(0)

  ratios.forEach((ratio, index) => {
    // 동점이면 왼쪽 컬럼을 고른다 — 첫 행이 왼쪽부터 차도록.
    let target = 0
    for (let i = 1; i < columnCount; i += 1) {
      if (heights[i] < heights[target]) target = i
    }
    columns[target].push(index)
    // 컬럼 폭이 모두 같으므로 상대 높이는 1/ratio로 충분하다. 실제 px은 필요 없다.
    heights[target] += 1 / ratio
  })

  return columns
}
