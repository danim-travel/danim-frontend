import { escapeHtml } from "@/lib/escapeHtml";
import { attachHorizontalWheel } from "@/lib/horizontalWheel";
import type { NearPostSpot } from "@/types";
import { formatDistance, type NearbyGroup } from "./nearbySpots";

// ── 치수 ──────────────────────────────────────────────────────────

/** 물방울 핀 크기(px). 게시글 번호 핀(34px + 꼬리)보다 작게 둬서 위계를 유지한다. */
const PIN_W = 24;
const PIN_H = 32;
const PIN_W_SELECTED = 32;
const PIN_H_SELECTED = 43;

/**
 * 루트 박스 크기. **선택 상태(=최대 크기)보다 크고, 상수여야 한다.**
 *
 * Kakao는 anchor 오프셋(margin)을 content를 "측정한 시점"의 크기로 고정한다. 선택될 때
 * 루트가 커지면 예전 오프셋을 계속 써서 핀이 실제 좌표에서 픽셀 단위로 밀리고, 줌을 바꾸면
 * 그 고정 픽셀 오차가 지리적으로 다른 위치처럼 보인다. 그래서 루트는 못박고 안쪽만 절대배치한다.
 *
 * 동시에 이 박스가 곧 탭 영역이다. 투명 패드를 루트 **밖으로** 빼면 이웃 핀의 그림 위를
 * 덮어 그쪽 클릭을 가로채므로, 여유는 반드시 루트 안에서만 준다.
 */
const PIN_ROOT_W = 44;
const PIN_ROOT_H = 48;

/** 카드와 핀 머리 사이 간격(px). */
const CARD_GAP = 10;
/** 카드 썸네일 한 변(px). 개수가 많아지면 작은 쪽으로 내려 한 화면에 더 담는다. */
const CARD_THUMB_LG = 92;
const CARD_THUMB_SM = 60;
/** 큰 썸네일을 유지하는 최대 개수. */
const CARD_THUMB_LG_MAX = 3;
/** 썸네일 사이 간격(px). */
const CARD_THUMB_GAP = 8;
/** 카드 내용의 최대 너비(px) — 넘치면 썸네일 줄은 가로 스크롤, 장소명은 말줄임. */
const CARD_MAX_W = 340;

/**
 * 물방울(티어드롭) 실루엣. viewBox 24×32, 뾰족한 끝이 아래쪽 `(12, 30.8)`.
 * 끝점 아래 1.2 단위는 stroke가 잘리지 않도록 비워둔 여백이며, 렌더 시 `tipInset`으로 상쇄한다.
 */
const PIN_PATH = "M12 30.8C12 30.8 2.5 19.4 2.5 11a9.5 9.5 0 1 1 19 0c0 8.4-9.5 19.8-9.5 19.8Z";
/** viewBox 아래쪽 여백 비율 — 이만큼 내려야 그림의 끝점이 실제 좌표에 꽂힌다. */
const TIP_INSET_RATIO = (32 - 30.8) / 32;

// ── 마크업 빌더 ────────────────────────────────────────────────────

/**
 * 개수 라벨 크기. viewBox(24×32) 좌표계 값이라 페이지의 px가 아니고 핀 크기를 따라 커진다.
 * 타이포 토큰(px)을 쓰면 선택 시 확대된 핀에서 글자만 상대적으로 작아진다.
 */
const PIN_COUNT_FONT = 11;

/** 핀 머리. 여러 기록이 묶였으면 흰 원 대신 개수를 박아 "겹친 핀"이라는 걸 드러낸다. */
function pinHeadMarkup(count: number): string {
  if (count > 1) {
    return `<text x="12" y="11" text-anchor="middle" dominant-baseline="central" style="fill:var(--color-bg-card);font-size:${PIN_COUNT_FONT}px;font-weight:700;font-family:sans-serif;">${count}</text>`;
  }
  return `<circle cx="12" cy="11" r="4.2" style="fill:var(--color-bg-card);" />`;
}

function pinSvgMarkup(count: number, w: number, h: number): string {
  return `<svg width="${w}" height="${h}" viewBox="0 0 24 32" style="display:block;filter:drop-shadow(var(--shadow-map-pin));">
      <path d="${PIN_PATH}" style="fill:var(--color-primary);stroke:var(--color-bg-card);stroke-width:2.2;" />
      ${pinHeadMarkup(count)}
    </svg>`;
}

/**
 * 썸네일 하나가 곧 "이 게시글 열기" 버튼이다. `data-open` 값으로 어느 글인지 식별한다.
 *
 * `draggable="false"` — 브라우저 기본 이미지 드래그가 걸리면 스크롤 제스처가 중간에 끊긴다.
 */
function thumbnailsMarkup(posts: NearPostSpot[], placeName: string): string {
  const size = posts.length > CARD_THUMB_LG_MAX ? CARD_THUMB_SM : CARD_THUMB_LG;
  const total = posts.length;

  return posts
    .map(
      (post, index) => `<button type="button" data-open="${escapeHtml(post.post_id)}" aria-label="${escapeHtml(placeName)} 기록 ${index + 1}/${total} 열기"
           style="flex:0 0 auto;width:${size}px;height:${size}px;padding:0;border:0;border-radius:var(--radius-sm);overflow:hidden;background:var(--color-bg-subtle);cursor:pointer;">
           <img src="${escapeHtml(post.thumbnail)}" alt="" draggable="false" style="width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;" />
         </button>`,
    )
    .join("");
}

/**
 * 선택 시 뜨는 카드. 핀 "위"에 절대배치한다 — 아래에 두면 카드 높이만큼 핀이
 * 실제 좌표에서 떠오르고, 루트 박스 밖이라 anchor 계산에도 영향을 주지 않는다.
 *
 * 썸네일 줄은 항상 한 줄이고 넘치면 가로 스크롤한다. 줄바꿈으로 두면 기록이 많은 장소에서
 * 카드가 세로로 자라 지도를 덮는다. `touch-action:pan-x`로 브라우저에 "여기는 가로 패닝"을
 * 명시해 지도 드래그와 구분하고, `overscroll-behavior-x:contain`으로 끝까지 민 뒤에도
 * 지도로 제스처가 넘어가지 않게 한다.
 *
 * 장소명 줄에도 최대 너비를 걸어야 한다. 긴 이름 하나로 카드가 넓어지면
 * 지도 컨테이너의 `overflow-hidden`에 잘린다.
 */
function cardMarkup(group: NearbyGroup): string {
  const count = group.posts.length;
  const meta = `${formatDistance(group.distance)}${count > 1 ? ` · 기록 ${count}개` : ""}`;

  return `<div style="position:absolute;left:50%;bottom:${PIN_H_SELECTED + CARD_GAP}px;transform:translateX(-50%);z-index:1;display:flex;flex-direction:column;gap:10px;padding:10px;border-radius:var(--radius-lg);background:var(--color-bg-card);box-shadow:var(--shadow-map-card);cursor:default;">
      <div data-scroll="true" style="display:flex;gap:${CARD_THUMB_GAP}px;max-width:${CARD_MAX_W}px;overflow-x:auto;overflow-y:hidden;touch-action:pan-x;overscroll-behavior-x:contain;">${thumbnailsMarkup(
        group.posts,
        group.place_name,
      )}</div>
      <div style="padding:0 2px 2px;text-align:left;max-width:${CARD_MAX_W}px;">
        <div style="font-size:var(--text-base);font-weight:700;color:var(--color-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(
          group.place_name,
        )}</div>
        <div style="margin-top:3px;font-size:var(--text-body-sm);color:var(--color-text-muted);white-space:nowrap;">${meta}</div>
      </div>
    </div>`;
}

// ── 오버레이 ───────────────────────────────────────────────────────

/**
 * 눌린 지점에서 "열기" 버튼을 찾아 열기/선택을 가른다.
 *
 * 지도가 조금이라도 밀리면 mouseup이 다른 노드에서 나고, 그때 click의 target은 두 노드의
 * 공통 조상인 루트가 된다. 그러면 위임 조회가 빈손이 되므로 누르기 시작한 노드를 따로 기억한다.
 */
function createPinClickHandler(onSelect: () => void, onOpen: (postId: string) => void) {
  let pressed: Element | null = null;

  const onMouseDown = (e: Event) => {
    pressed = e.target instanceof Element ? e.target : null;
  };

  const onClick = (e: Event) => {
    e.stopPropagation();
    const clicked = e.target instanceof Element ? e.target : null;
    const opener = clicked?.closest("[data-open]") ?? pressed?.closest("[data-open]") ?? null;
    pressed = null;

    const postId = opener?.getAttribute("data-open");
    if (postId) onOpen(postId);
    else onSelect();
  };

  return { onMouseDown, onClick };
}

/**
 * 주변 장소 핀의 루트 엘리먼트. 오버레이당 한 번만 만든다.
 *
 * `setContent()`로 노드를 통째로 갈아끼우면 그 노드에 걸어둔 DOM 리스너가 함께 사라져,
 * 한 번 선택된 핀은 이후 클릭이 전혀 먹지 않는다. 그래서 루트는 유지한 채 안쪽 마크업만
 * 교체하고(`updateNearbyPinContent`), 클릭은 루트에서 위임 처리한다.
 */
export function createNearbyPinRoot(
  onSelect: () => void,
  onOpen: (postId: string) => void,
): HTMLElement {
  const root = document.createElement("div");
  root.style.cssText = `position:relative;width:${PIN_ROOT_W}px;height:${PIN_ROOT_H}px;cursor:pointer;`;

  const { onMouseDown, onClick } = createPinClickHandler(onSelect, onOpen);
  root.addEventListener("mousedown", onMouseDown);
  root.addEventListener("click", onClick);
  // 지도가 휠을 집어 확대/축소하기 전에 우리가 먼저 가로 스크롤로 쓴다.
  // 해제 함수는 쓰지 않는다 — 루트는 clearNearby()에서 DOM과 함께 버려지고 재사용하지
  // 않으므로 리스너도 같이 수거된다. 루트를 재사용하게 되면 이 반환값을 받아야 한다.
  attachHorizontalWheel(root, (target) => target?.closest<HTMLElement>("[data-scroll]") ?? null);

  return root;
}

/**
 * 핀 마크업 갱신. 전달받은 루트의 `innerHTML`을 직접 바꾼다(부수효과).
 *
 * 핀은 루트 박스의 "아래 중앙"에 붙인다 — 선택되어 커져도 뾰족한 끝은 제자리다.
 */
export function updateNearbyPinContent(
  root: HTMLElement,
  group: NearbyGroup,
  selected: boolean,
): void {
  const w = selected ? PIN_W_SELECTED : PIN_W;
  const h = selected ? PIN_H_SELECTED : PIN_H;
  const tipInset = TIP_INSET_RATIO * h;

  root.innerHTML = `
    ${selected ? cardMarkup(group) : ""}
    <div style="position:absolute;left:50%;bottom:${-tipInset}px;transform:translateX(-50%);width:${w}px;height:${h}px;">
      ${pinSvgMarkup(group.posts.length, w, h)}
    </div>
  `;
}
