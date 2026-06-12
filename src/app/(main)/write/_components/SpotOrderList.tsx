'use client'

import { GripVertical, X } from 'lucide-react'
import type { SpotFormData } from '../_hooks/useWriteForm'
import { useDragReorder } from '../_hooks/useDragReorder'

interface SpotOrderListProps {
  spots: SpotFormData[]
  activeId: string
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onReorderSpots: (srcIdx: number, targetIdx: number) => void
}

export default function SpotOrderList({
  spots,
  activeId,
  onSelect,
  onRemove,
  onReorderSpots,
}: SpotOrderListProps) {
  const {
    state: { dragSrc, dragOver },
    handlers: { handleDragStart, handleDragOver, handleDrop, handleDragEnd },
  } = useDragReorder(onReorderSpots)

  const getBorderClass = (isActive: boolean, isDragOver: boolean) => {
    if (isActive) return 'border-primary bg-primary/10 shadow-sm'
    if (isDragOver) return 'border-primary border-dashed bg-primary/5'
    return 'border-border-subtle bg-bg-card hover:border-border'
  }

  return (
    <div className="flex flex-col gap-1.5">
      {spots.map((spot, i) => {
        const isActive = spot.id === activeId
        const isDragOver = dragOver === i
        return (
          <div
            key={spot.id}
            draggable
            onDragStart={(e) => handleDragStart(e, i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={(e) => handleDrop(e, i)}
            onDragEnd={handleDragEnd}
            onClick={() => onSelect(spot.id)}
            className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border-2 transition-all cursor-pointer select-none ${getBorderClass(
              isActive,
              isDragOver
            )} ${dragSrc === i ? 'opacity-30' : ''}`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-text-inverse text-nav font-bold shrink-0 ${
                isActive ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p
                className={`text-caption font-medium truncate ${
                  spot.location ? 'text-text-emphasis' : 'text-text-disabled'
                }`}
              >
                {spot.location?.place_name ?? `${i + 1}번 위치 미설정`}
              </p>
              {spot.location && (
                <p className="text-tiny text-text-disabled truncate mt-0.5">
                  {spot.location.road_address_name || spot.location.address_name}
                </p>
              )}
            </div>
            {spots.length > 1 && i > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(spot.id) }}
                className="text-text-placeholder hover:text-error transition-colors shrink-0"
                aria-label="마커 삭제"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {/* stopPropagation: grip 클릭이 상위 div의 onSelect까지 전파되지 않도록 차단 */}
            <div
              className="text-text-placeholder hover:text-text-muted cursor-grab active:cursor-grabbing shrink-0"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-4 h-4" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
