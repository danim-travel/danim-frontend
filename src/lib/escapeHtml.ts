/**
 * `innerHTML` 조립용 이스케이프.
 *
 * **속성에 넣을 때는 반드시 따옴표로 감싼 자리여야 한다.** 백틱과 공백은 변환하지 않으므로
 * 따옴표 없는 속성값에 넣으면 값이 속성 경계를 벗어날 수 있다.
 *
 * 텍스트 노드와 따옴표로 감싼 속성값 두 경우에만 쓴다. URL 스킴은 검사하지 않으므로
 * `href`처럼 스킴이 실행으로 이어지는 자리에는 별도 검증이 필요하다.
 */
export function escapeHtml(raw: string): string {
  const table: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return raw.replace(/[&<>"']/g, (char) => table[char]);
}
