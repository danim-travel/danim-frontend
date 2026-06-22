import { useEffect, useState } from "react";

/** isPending이 delay(ms)보다 길게 유지될 때만 true를 반환해 짧은 요청의 로딩 깜박임을 막는다. */
export function useDelayedPending(isPending: boolean, delay = 200): boolean {
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowLoading(isPending), isPending ? delay : 0);
    return () => clearTimeout(timer);
  }, [isPending, delay]);

  return showLoading;
}
