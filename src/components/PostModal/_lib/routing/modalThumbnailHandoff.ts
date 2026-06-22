/**
 * 인터셉트 라우트(`/posts/[id]`) 진입 시 placeholder 썸네일을 전달하기 위한 1회성 핸드오프.
 * 클릭 측에서 set → 인터셉트 모달 측에서 read+remove. URL을 더럽히지 않기 위해 sessionStorage 사용.
 *
 * 30초 expiry로 stale 방지: 클릭 후 navigation을 취소한 채 시간이 지나면,
 * 다음 같은 postId 진입 시 옛 썸네일이 placeholder로 노출되는 것을 막는다.
 */
const KEY_PREFIX = "modal-thumb:";
const TTL_MS = 30_000;

interface HandoffPayload {
  url: string;
  ts: number;
}

export function setModalThumbnail(postId: string, thumbnail: string) {
  try {
    const payload: HandoffPayload = { url: thumbnail, ts: Date.now() };
    sessionStorage.setItem(KEY_PREFIX + postId, JSON.stringify(payload));
  } catch {}
}

export function consumeModalThumbnail(postId: string): string | undefined {
  try {
    const key = KEY_PREFIX + postId;
    const raw = sessionStorage.getItem(key);
    if (!raw) return undefined;
    sessionStorage.removeItem(key);
    const parsed = JSON.parse(raw) as HandoffPayload;
    if (Date.now() - parsed.ts > TTL_MS) return undefined;
    return parsed.url;
  } catch {
    return undefined;
  }
}
