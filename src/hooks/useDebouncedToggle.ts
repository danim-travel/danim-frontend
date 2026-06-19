import { useCallback, useEffect, useRef, useState } from 'react'

interface UseDebouncedToggleOptions {
  /**
   * 서버(또는 캐시) 기준 현재 상태.
   * 외부 변경(invalidate, 다른 화면에서의 토글 등)이 발생하면 자동으로 localState에 반영된다.
   * 단, 디바운스 세션이 진행 중일 때는 사용자 의도를 보존하기 위해 동기화를 보류한다.
   */
  serverState: boolean
  /**
   * 디바운스 종료 시점에 호출되는 콜백.
   * `wasState`는 세션 시작 시점의 서버 상태이며, 기존 mutation에 그대로 전달해야 한다.
   *   - wasState=true  → DELETE (좋아요/북마크 취소)
   *   - wasState=false → POST   (좋아요/북마크)
   */
  onCommit: (wasState: boolean) => void
  /** 디바운스 지연 (ms). 기본 400ms */
  delay?: number
}

interface UseDebouncedToggleResult {
  /** 즉시 토글되는 UI 상태 — 버튼 표시에 사용 */
  localState: boolean
  /** 버튼 클릭 핸들러 */
  toggle: () => void
  /** commit 대기 중 여부 (디바운스 세션이 진행 중인지) */
  isPending: boolean
  /**
   * 좋아요·북마크 count 표시에 사용하는 보정 delta.
   * serverCount + countDelta 로 현재 UI 카운트를 산출한다.
   * 초기 서버 상태와 비교해 최종적으로 되돌아왔으면 0을 반환한다.
   */
  countDelta: -1 | 0 | 1
}

/**
 * 토글 버튼(좋아요·북마크 등) 디바운스 + net-zero 감지 훅.
 *
 * - UI는 클릭마다 즉시 토글된다 (낙관적 반응 보존).
 * - 실제 mutation은 마지막 클릭 후 `delay` ms 동안 추가 클릭이 없을 때 1번만 호출된다.
 * - 세션 시작 시점 상태(initial)와 최종 상태(local)가 같으면 (짝수 번 클릭) commit을 생략한다 — net-zero.
 * - 컴포넌트 unmount 시 pending toggle은 cleanup에서 즉시 flush 되어 마지막 의도가 서버에 반영된다.
 */
export function useDebouncedToggle({
  serverState,
  onCommit,
  delay = 400,
}: UseDebouncedToggleOptions): UseDebouncedToggleResult {
  const [localState, setLocalState] = useState<boolean>(serverState)
  const [baseState, setBaseState] = useState<boolean>(serverState)
  const [isPending, setIsPending] = useState<boolean>(false)

  // 디바운스 세션 진행 중 여부 — 외부 serverState 변화로 인한 동기화를 막는 가드.
  const sessionActiveRef = useRef<boolean>(false)
  // 세션 시작 시점의 서버 상태 (commit 시 wasState로 전달)
  const initialStateRef = useRef<boolean>(serverState)
  // 현재 localState 최신값 — cleanup/flush에서 stale 클로저를 피하기 위한 ref
  const localStateRef = useRef<boolean>(serverState)
  // 디바운스 타이머
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // onCommit 최신 참조 — 호출자가 매 렌더 새 함수를 전달해도 안정적으로 호출
  const onCommitRef = useRef(onCommit)

  useEffect(() => {
    onCommitRef.current = onCommit
  }, [onCommit])

  // 외부 serverState 동기화 — 디바운스 세션이 없을 때만 반영
  useEffect(() => {
    if (sessionActiveRef.current) return
    setLocalState(serverState)
    setBaseState(serverState)
    localStateRef.current = serverState
  }, [serverState])

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const finalize = useCallback(() => {
    const initial = initialStateRef.current
    const final = localStateRef.current
    sessionActiveRef.current = false
    setIsPending(false)
    clearTimer()
    if (initial !== final) {
      // wasState = initial: 기존 mutation 인터페이스(wasLiked/wasBookmarked) 그대로 사용
      onCommitRef.current(initial)
    }
  }, [clearTimer])

  const toggle = useCallback(() => {
    if (!sessionActiveRef.current) {
      // 새 세션 시작 — localState의 현재 값을 initial로 스냅샷.
      // serverState가 아닌 localStateRef를 쓰는 이유:
      // mutation onMutate가 캐시를 즉시 업데이트 → serverState prop이 바뀌면
      // toggle 함수가 재생성되어 serverState를 initial로 찍을 경우 "mutation이
      // 완료된 상태"가 initial이 되어버려 net-zero 판단이 틀어짐.
      sessionActiveRef.current = true
      initialStateRef.current = localStateRef.current
      setBaseState(localStateRef.current)
      setIsPending(true)
    }
    const next = !localStateRef.current
    localStateRef.current = next
    setLocalState(next)

    clearTimer()
    timerRef.current = setTimeout(() => {
      finalize()
    }, delay)
  }, [delay, clearTimer, finalize])

  // unmount 시 pending toggle을 즉시 flush — 마지막 사용자 의도 보존
  useEffect(() => {
    return () => {
      if (sessionActiveRef.current) {
        clearTimer()
        const initial = initialStateRef.current
        const final = localStateRef.current
        sessionActiveRef.current = false
        if (initial !== final) {
          onCommitRef.current(initial)
        }
      }
    }
  }, [clearTimer])

  const countDelta: -1 | 0 | 1 = localState === baseState ? 0 : localState ? 1 : -1

  return { localState, toggle, isPending, countDelta }
}
