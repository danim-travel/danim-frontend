/**
 * 스냅을 잠시 끄고 되돌리기까지 기다리는 시간(ms).
 * 휠 틱 사이 간격보다 넉넉해야 연속으로 굴릴 때 중간에 다시 붙지 않는다.
 */
const SNAP_RESUME_DELAY = 180;

/**
 * 세로 휠(deltaY)을 가로 스크롤로 옮긴다.
 *
 * `overflow-x: auto` 컨테이너는 일반 마우스의 세로 휠을 가로 스크롤로 **자동 변환해주지
 * 않는다.** 페이지가 스크롤되지 않는 레이아웃에서는 휠이 아무 일도 하지 않는 것처럼 보이고,
 * 지도 위에 얹힌 경우엔 반대로 지도가 휠을 집어 확대/축소해 버린다.
 *
 * 넘치지 않는 컨테이너에서는 아무것도 하지 않고 이벤트를 그대로 흘려보낸다 —
 * 지도 줌 같은 기본 동작을 뺏지 않기 위해서다.
 *
 * @param el 리스너를 붙일 엘리먼트
 * @param getScroller 실제로 스크롤할 대상을 이벤트 타깃에서 찾는다. 생략하면 `el` 자신.
 * @returns 리스너 해제 함수
 */
export function attachHorizontalWheel(
  el: HTMLElement,
  getScroller?: (target: Element | null) => HTMLElement | null,
): () => void {
  // 스냅을 잠시 꺼둔 대상과 원래 값. 휠이 멈추면 되돌린다.
  const suspended = new Map<HTMLElement, { saved: string; timer: number }>();

  /**
   * `scroll-snap-type: x mandatory`는 **프로그래밍 방식 스크롤에도** 적용돼, 스냅 간격의
   * 절반에 못 미치는 이동은 원위치로 되붙인다. 휠 1틱(~100px)은 칩 하나(150~240px)의
   * 절반을 넘지 못하는 경우가 많아, 그대로 두면 휠이 통째로 죽은 것처럼 보인다.
   * 굴리는 동안만 스냅을 끄고 멈추면 되돌려 스냅감은 유지한다.
   */
  const suspendSnap = (scroller: HTMLElement) => {
    const found = suspended.get(scroller);
    if (found) {
      clearTimeout(found.timer);
    }

    const saved = found ? found.saved : scroller.style.scrollSnapType;
    if (!found) scroller.style.scrollSnapType = "none";

    const timer = window.setTimeout(() => {
      scroller.style.scrollSnapType = saved;
      suspended.delete(scroller);
    }, SNAP_RESUME_DELAY);

    suspended.set(scroller, { saved, timer });
  };

  const onWheel = (e: WheelEvent) => {
    const target = e.target instanceof Element ? e.target : null;
    const scroller = getScroller ? getScroller(target) : el;
    if (!scroller || scroller.scrollWidth <= scroller.clientWidth) return;

    // 일반 마우스는 deltaY만 온다. 트랙패드 가로 스와이프는 deltaX로 온다.
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (delta === 0) return;

    suspendSnap(scroller);
    scroller.scrollLeft += delta;
    e.preventDefault();
    e.stopPropagation();
  };

  // preventDefault를 쓰려면 passive가 아니어야 한다.
  el.addEventListener("wheel", onWheel, { passive: false });

  return () => {
    el.removeEventListener("wheel", onWheel);
    // 정리 중에 스냅이 꺼진 채로 남지 않도록 즉시 되돌린다.
    suspended.forEach(({ saved, timer }, scroller) => {
      clearTimeout(timer);
      scroller.style.scrollSnapType = saved;
    });
    suspended.clear();
  };
}
