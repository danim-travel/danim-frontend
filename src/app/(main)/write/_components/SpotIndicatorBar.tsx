'use client'

import type { SpotFormData } from '../_hooks/useWriteForm'

const getSpotButtonClass = (spot: SpotFormData, activeId: string) => {
  if (spot.id === activeId) return 'bg-primary border-primary text-text-inverse shadow-md'
  if (spot.location) return 'bg-bg-card border-primary text-primary'
  return 'bg-bg-card border-border text-text-disabled hover:border-border-strong'
}

interface SpotIndicatorBarProps {
  spots: SpotFormData[]
  activeId: string
  maxSpots: number
  onSelect: (id: string) => void
  onAdd: () => void
  onRemove: (id: string) => void
}

export default function SpotIndicatorBar({
  spots,
  activeId,
  maxSpots,
  onSelect,
  onAdd,
  onRemove,
}: SpotIndicatorBarProps) {
  return (
    <div className="flex items-center gap-0">
      {spots.map((spot, i) => (
        <div key={spot.id} className="flex items-center">
          <div className="relative">
            <button
              onClick={() => onSelect(spot.id)}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-nav font-bold border-2 transition-all ${getSpotButtonClass(spot, activeId)}`}
            >
              {i + 1}
            </button>
            {spots.length > 1 && i > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(spot.id) }}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-text-muted text-text-inverse flex items-center justify-center hover:bg-error transition-colors"
                aria-label="마커 삭제"
              >
                <span className="text-[10px] leading-none">×</span>
              </button>
            )}
          </div>
          {i < spots.length - 1 && (
            <div
              className={`w-6 h-0.5 mx-0.5 transition-colors ${
                spot.location ? 'bg-primary' : 'bg-border'
              }`}
            />
          )}
        </div>
      ))}
      {spots.length < maxSpots && (
        <div className="flex items-center">
          <div className="w-6 h-0.5 mx-0.5 bg-border" />
          <button
            onClick={onAdd}
            className="w-9 h-9 rounded-full border-2 border-dashed border-border-strong flex items-center justify-center text-text-disabled hover:border-primary hover:text-primary transition-colors text-lg font-light"
          >
            +
          </button>
        </div>
      )}
    </div>
  )
}
