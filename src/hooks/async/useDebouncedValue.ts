import { useState, useEffect } from 'react'

/**
 * value가 변경된 후 delay ms가 지날 때까지 업데이트되지 않는 디바운스 값을 반환한다.
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])

  return debouncedValue
}
