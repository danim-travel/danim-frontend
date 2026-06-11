'use client'

import { useState, useCallback } from 'react'
import type { SpotFormData } from '../_types/write.types'
import { MAX_SPOTS } from '../_constants'

const makeSpot = (): SpotFormData => ({
  id: crypto.randomUUID(),
  location: null,
  content: '',
  images: [],
  previewUrls: [],
})

export function useSpotManager() {
  // spot 배열. 초기값은 빈 spot 3개
  const [spots, setSpots] = useState<SpotFormData[]>(() => [makeSpot(), makeSpot(), makeSpot()])
  // 현재 선택된 spot의 id
  const [activeId, setActiveId] = useState<string>(() => spots[0].id)

  const activeIdx = spots.findIndex((s) => s.id === activeId)
  const active = spots[activeIdx]!

  const updateSpot = useCallback((id: string, updates: Partial<SpotFormData>) => {
    setSpots((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)))
  }, [])

  const selectSpot = useCallback((id: string) => {
    setActiveId(id)
  }, [])

  const addSpot = () => {
    if (spots.length >= MAX_SPOTS) return
    // setSpots 전에 미리 만들어야 selectSpot에 동일한 id를 전달할 수 있음
    const s = makeSpot()
    setSpots((prev) => [...prev, s])
    selectSpot(s.id)
  }

  const reorderSpots = (srcIdx: number, targetIdx: number) => {
    setSpots((prev) => {
      const next = [...prev]
      const [moved] = next.splice(srcIdx, 1)
      next.splice(targetIdx, 0, moved)
      return next
    })
  }

  return {
    spots,
    activeId,
    activeIdx,
    active,
    selectSpot,
    addSpot,
    updateSpot,
    reorderSpots,
  }
}
