'use client'

import { useRef, useState } from 'react'

/**
 * 데스크톱 HTML5 DnD + 모바일 터치 이벤트를 모두 지원하는 순서 변경 훅.
 *
 * - 데스크톱: handleDragStart/Over/Drop/End 를 아이템 컨테이너에 연결
 * - 모바일:   handleTouchStart/Move/End 를 드래그 핸들 요소(GripVertical)에 연결
 *
 * 모바일 구현 핵심:
 * 1) touchstart 에서 시작 인덱스 기록
 * 2) touchmove 에서 document.elementFromPoint 로 현재 포인터 아래 아이템을 찾는다.
 *    - 자기 자신(드래그 중인 엘리먼트)이 가려서 hit-test 가 안 되므로
 *      pointer-events: none 을 일시적으로 적용한다.
 * 3) touchend 에서 onReorder 호출.
 *
 * data-drag-index="<idx>" 속성으로 hit-test 대상 아이템을 식별한다.
 */
export function useDragReorder(onReorder: (src: number, target: number) => void) {
  const [dragSrc, setDragSrc] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  // 터치 드래그 중 자기 자신 hit-test 회피용
  const draggingElRef = useRef<HTMLElement | null>(null)

  // ──────────────────────────────────────────────
  // Desktop: HTML5 DnD
  // ──────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, idx: number) => {
    e.dataTransfer.effectAllowed = 'move'
    setDragSrc(idx)
  }

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOver !== idx) setDragOver(idx)
  }

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault()
    if (dragSrc !== null && dragSrc !== targetIdx) {
      onReorder(dragSrc, targetIdx)
    }
    setDragSrc(null)
    setDragOver(null)
  }

  const handleDragEnd = () => {
    setDragSrc(null)
    setDragOver(null)
  }

  // ──────────────────────────────────────────────
  // Mobile: Touch events
  // ──────────────────────────────────────────────
  const findDragItem = (target: EventTarget | null): HTMLElement | null => {
    if (!(target instanceof HTMLElement)) return null
    return target.closest<HTMLElement>('[data-drag-index]')
  }

  const handleTouchStart = (e: React.TouchEvent, idx: number) => {
    // 핸들에서 시작 — 시작 아이템 컨테이너를 찾아 hit-test 회피 대상에 등록
    const item = findDragItem(e.currentTarget) ?? findDragItem(e.target)
    draggingElRef.current = item
    setDragSrc(idx)
    setDragOver(idx)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragSrc === null) return
    // 드래그 중 스크롤 방지
    if (e.cancelable) e.preventDefault()

    const touch = e.touches[0]
    if (!touch) return

    const dragging = draggingElRef.current
    // 자기 자신이 가려져서 hit-test 가 안 되므로 잠시 비활성화
    const prevPE = dragging?.style.pointerEvents
    if (dragging) dragging.style.pointerEvents = 'none'

    const el = document.elementFromPoint(touch.clientX, touch.clientY)

    if (dragging) dragging.style.pointerEvents = prevPE ?? ''

    const item = findDragItem(el)
    if (!item) return
    const idxAttr = item.dataset.dragIndex
    if (!idxAttr) return
    const idx = Number(idxAttr)
    if (Number.isNaN(idx)) return
    if (dragOver !== idx) setDragOver(idx)
  }

  const handleTouchEnd = () => {
    if (dragSrc !== null && dragOver !== null && dragSrc !== dragOver) {
      onReorder(dragSrc, dragOver)
    }
    draggingElRef.current = null
    setDragSrc(null)
    setDragOver(null)
  }

  return {
    state: { dragSrc, dragOver },
    handlers: {
      handleDragStart,
      handleDragOver,
      handleDrop,
      handleDragEnd,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
    },
  }
}
