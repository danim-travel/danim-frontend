/** KakaoMap SDK처럼 CSS 클래스를 쓸 수 없는 환경에서 토큰 값을 읽을 때만 사용한다. */
export function getCssVar(name: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
