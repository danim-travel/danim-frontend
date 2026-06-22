/**
 * 인터셉트 라우트(`/posts/[id]`) 진입 시 placeholder 썸네일을 전달하기 위한 1회성 핸드오프.
 * 클릭 측에서 set → 인터셉트 모달 측에서 read+remove. URL을 더럽히지 않기 위해 sessionStorage 사용.
 */
const KEY_PREFIX = "modal-thumb:";

export function setModalThumbnail(postId: string, thumbnail: string) {
  try { sessionStorage.setItem(KEY_PREFIX + postId, thumbnail); } catch {}
}

export function consumeModalThumbnail(postId: string): string | undefined {
  try {
    const key = KEY_PREFIX + postId;
    const value = sessionStorage.getItem(key) ?? undefined;
    if (value) sessionStorage.removeItem(key);
    return value;
  } catch {
    return undefined;
  }
}
