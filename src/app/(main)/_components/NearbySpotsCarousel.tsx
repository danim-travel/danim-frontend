"use client";

import Image from "next/image";
import { useEffect, useId, useRef } from "react";
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

  // 지도 핀을 눌러 선택이 바뀌었을 때도 해당 칩이 보이도록 따라 움직인다.
  useEffect(() => {
    if (!selectedKey) return;
    const chip = listRef.current?.querySelector(
      `[data-group-key="${CSS.escape(selectedKey)}"]`,
    );
    chip?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [selectedKey]);

  if (groups.length === 0) return null;

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
      </div>
    </div>
  );
}

export default NearbySpotsCarousel;
