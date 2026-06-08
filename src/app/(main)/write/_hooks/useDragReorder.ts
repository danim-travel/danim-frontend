'use client'

import { useState } from 'react'

export function useDragReorder(onReorder: (src: number, target: number) => void) {
  const [dragSrc, setDragSrc] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    e.dataTransfer.effectAllowed = 'move' // 드래그 커서를 이동 아이콘으로 표시
    setDragSrc(idx)
  }

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault() // 기본 동작 막지 않으면 drop 이벤트가 발화하지 않음
    e.dataTransfer.dropEffect = 'move'
    if (dragOver !== idx) setDragOver(idx)
  }

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault()
    // 같은 위치에 드롭하면 순서 변경 없이 상태만 초기화
    if (dragSrc !== null && dragSrc !== targetIdx) {
      onReorder(dragSrc, targetIdx)
    }
    setDragSrc(null)
    setDragOver(null)
  }

  const handleDragEnd = () => {
    // drop 없이 드래그가 취소된 경우(ESC 등) 상태 초기화
    setDragSrc(null)
    setDragOver(null)
  }

  return {
    state: { dragSrc, dragOver },
    handlers: { handleDragStart, handleDragOver, handleDrop, handleDragEnd },
  }
}
