/**
 * 내 위치 파란 점.
 *
 * `CustomOverlay`가 DOM을 요구해 인라인 style이 불가피하다 — 색·그림자는 하드코딩하지 않고
 * 전역 CSS 변수를 참조한다. 지도 조작을 방해하지 않도록 포인터 이벤트는 통과시킨다.
 */
export function createMyLocationDot(): HTMLElement {
  const el = document.createElement("div");
  el.style.cssText =
    "position:relative;width:30px;height:30px;display:flex;align-items:center;justify-content:center;pointer-events:none;";
  el.innerHTML = `
    <div style="position:absolute;inset:0;border-radius:50%;background:var(--color-my-location);opacity:0.2;"></div>
    <div style="position:relative;width:16px;height:16px;border-radius:50%;background:var(--color-my-location);border:3px solid var(--color-bg-card);box-shadow:var(--shadow-map-pin);"></div>
  `;
  return el;
}
