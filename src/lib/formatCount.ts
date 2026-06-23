/** 큰 수를 K/M/B 단위로 축약한다. 1000 미만은 그대로 표시. */
export function formatCount(n: number): string {
  if (n < 1000) return String(n)
  const compact = (value: number, unit: string) => {
    const formatted = value.toFixed(1).replace(/\.0$/, "")
    return `${formatted}${unit}`
  }
  if (n < 999_950) return compact(n / 1_000, "K")
  if (n < 999_950_000) return compact(n / 1_000_000, "M")
  return compact(n / 1_000_000_000, "B")
}
