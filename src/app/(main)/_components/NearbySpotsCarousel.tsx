"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type Transition } from "motion/react";
import { ChevronRight } from "lucide-react";
import { attachHorizontalWheel } from "@/lib/horizontalWheel";
import { formatDistance, type NearbyGroup } from "@/lib/map/nearbySpots";

interface NearbySpotsCarouselProps {
  /** 좌표로 묶인 장소 목록. 지도 핀과 1:1로 대응한다. */
  groups: NearbyGroup[];
  selectedKey: string | null;
  /** 미선택 장소의 칩을 누른 경우 — 지도 핀과 양방향으로 선택을 맞춘다. */
  onSelectGroup: (groupKey: string) => void;
  /** 기록이 하나뿐인 장소의 칩을 다시 누른 경우 — 바로 그 게시글을 연다. */
  onOpenPost: (postId: string) => void;
}

/** 끝에 닿았다고 볼 여유(px). 소수점 오차로 화살표가 깜빡이는 걸 막는다. */
const SCROLL_END_SLACK = 8;

/**
 * "콕콕" 두 번 찌르고 쉬는 리듬.
 *
 * 무한 반복은 지도 위 레이어에서 컴포지터를 계속 돌리고, 5초를 넘겨 자동 재생되는 모션이라
 * WCAG 2.2.2에도 걸린다. 두 바퀴(≈4.6초)만 돌고 멈춘다.
 */
const NUDGE_X = [0, 5, 0, 5, 0];
const NUDGE_TRANSITION: Transition = {
  duration: 0.9,
  times: [0, 0.14, 0.28, 0.42, 0.56],
  ease: "easeOut",
  repeat: 2,
  repeatDelay: 1.4,
};

/**
 * 칩은 **게시글이 아니라 장소** 단위다. 패널 제목("내 주변 장소")과 지도 핀이 모두
 * 장소 단위인데 칩만 게시글 단위로 두면, 같은 장소의 칩들이 한꺼번에 선택 상태가 돼
 * 처음 누른 칩에서도 모달이 열린다.
 *
 * 기록이 여러 개인 장소는 어느 글을 열지 **지도 카드의 썸네일**이 고르게 한다.
 */
export function NearbySpotsCarousel({
  groups,
  selectedKey,
  onSelectGroup,
  onOpenPost,
}: NearbySpotsCarouselProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const reduceMotion = useReducedMotion();
  const [canScrollRight, setCanScrollRight] = useState(false);
  // 한 번이라도 밀어봤으면 유도 애니메이션은 역할을 다했다.
  const [hasScrolled, setHasScrolled] = useState(false);

  // 마우스 휠로도 칩을 넘길 수 있게 한다. 지도 위에 얹힌 레이어라 세로 스크롤할 페이지가
  // 없어서, 연결하지 않으면 휠이 아무 반응도 하지 않는다.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    return attachHorizontalWheel(el);
  }, [groups]);

  // 오른쪽에 더 볼 게 남았는지 추적한다. 넘치지 않거나 끝까지 밀었으면 화살표를 감춘다.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const update = () => {
      // 소수점 오차와 스냅 여유를 감안해 약간의 임계값을 둔다.
      setCanScrollRight(el.scrollWidth - el.clientWidth - el.scrollLeft > SCROLL_END_SLACK);
    };

    const onScroll = () => {
      setHasScrolled(true);
      update();
    };

    update();
    el.addEventListener("scroll", onScroll, { passive: true });

    // ResizeObserver는 "관찰 대상 자신의 박스"만 본다 — 컨테이너 폭은 그대로인데 내용만
    // 넓어지는 경우(대표적으로 Pretendard 서브셋 폰트 스왑)를 못 잡는다. 그래서 스크롤
    // 컨테이너와 칩을 함께 관찰한다.
    const observer = new ResizeObserver(update);
    observer.observe(el);
    el.querySelectorAll<HTMLElement>("[data-group-key]").forEach((chip) => observer.observe(chip));

    return () => {
      el.removeEventListener("scroll", onScroll);
      observer.disconnect();
      // 목록이 비었다 돌아올 때 이전 값이 한 프레임 새어 나가지 않게 한다.
      setCanScrollRight(false);
    };
  }, [groups]);

  const scrollRight = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth * 0.8, behavior: "smooth" });
  }, []);

  // 지도 핀을 눌러 선택이 바뀌었을 때도 해당 칩이 보이도록 따라 움직인다.
  useEffect(() => {
    if (!selectedKey) return;
    const chip = listRef.current?.querySelector(
      `[data-group-key="${CSS.escape(selectedKey)}"]`,
    );
    chip?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [selectedKey]);

  if (groups.length === 0) return null;

  const nudging = !reduceMotion && !hasScrolled;

  return (
    <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none">
      {/*
        그라디언트 래퍼와 제목까지 pointer-events-auto로 두면 투명한 pt-8 영역이 지도
        하단 전체 폭의 드래그와 "빈 곳 클릭 → 선택 해제"를 삼킨다. 칩 목록에만 준다.
      */}
      <div className="bg-gradient-to-t from-bg-card/95 to-transparent px-2 pb-2 pt-8">
        <p id={titleId} className="mb-1 px-1 text-base font-semibold text-text">
          내 주변 장소
        </p>

        <div className="relative">
          {/*
            overflow-x-auto는 computed overflow-y까지 auto로 만들어 세로를 잘라낸다.
            padding 없이 두면 선택 링(ring)의 위·아래만 잘려 좌우 선만 남는다.
          */}
          <div
            ref={listRef}
            role="group"
            aria-labelledby={titleId}
            className="flex gap-2.5 overflow-x-auto scrollbar-none snap-x snap-mandatory px-1 py-2 pointer-events-auto"
          >
            {groups.map((group) => {
              const isSelected = group.key === selectedKey;
              const count = group.posts.length;
              const cover = group.posts[0];

              return (
                <button
                  key={group.key}
                  type="button"
                  data-group-key={group.key}
                  aria-pressed={isSelected}
                  onClick={() => {
                    // 기록이 하나뿐일 때만 재탭으로 연다. 여러 개면 어느 글인지 알 수 없으니
                    // 선택만 유지하고 지도 카드에서 고르게 둔다.
                    if (isSelected && count === 1) {
                      onOpenPost(cover.post_id);
                      return;
                    }
                    onSelectGroup(group.key);
                  }}
                  className={`shrink-0 snap-start flex items-center gap-3 rounded-pill bg-bg-card py-2 pl-2 pr-4 shadow-md transition-shadow ${
                    isSelected ? "ring-2 ring-primary" : "hover:shadow-lg"
                  }`}
                >
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-full bg-bg-subtle">
                    <Image
                      src={cover.thumbnail}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                    {count > 1 && (
                      <span className="absolute inset-x-0 bottom-0 bg-overlay text-center text-caption font-bold text-text-inverse">
                        {count}
                      </span>
                    )}
                  </span>
                  <span className="flex flex-col items-start gap-0.5">
                    <span className="max-w-36 truncate text-base font-semibold text-text">
                      {group.place_name}
                    </span>
                    <span className="text-body-sm text-text-muted">
                      {formatDistance(group.distance)}
                      {count > 1 && ` · 기록 ${count}개`}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/*
            더 볼 게 남았다는 신호. 가로 스크롤은 스크롤바가 없으면 있는지조차 알기 어렵다.
            translate 계열 유틸리티는 motion이 쓰는 inline transform과 충돌할 수 있으므로,
            위치는 바깥 래퍼가 잡고 애니메이션은 버튼이 x로만 준다.
          */}
          <AnimatePresence>
            {canScrollRight && (
              <div
                key="scroll-hint"
                className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1"
              >
                <motion.button
                  type="button"
                  onClick={scrollRight}
                  aria-label="다음 장소 보기"
                  className="pointer-events-auto flex size-8 items-center justify-center rounded-full bg-bg-card text-text-secondary shadow-md hover:bg-bg-subtle active:scale-95"
                  initial={{ opacity: 0, scale: 0.8 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  animate={
                    nudging
                      ? { opacity: 1, scale: 1, x: NUDGE_X }
                      : { opacity: 1, scale: 1, x: 0 }
                  }
                  transition={nudging ? NUDGE_TRANSITION : { duration: 0.15 }}
                >
                  <ChevronRight className="size-5" />
                </motion.button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default NearbySpotsCarousel;
