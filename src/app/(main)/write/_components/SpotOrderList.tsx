'use client'

import { useState, useRef } from 'react'
import { GripVertical, X, ChevronDown } from 'lucide-react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'

import type { SpotFormData } from '../_hooks/useWriteForm'
import { useDragReorder } from '../_hooks/useDragReorder'

const LocationSearch = dynamic(() => import('./LocationSearch'), { ssr: false })

export interface SpotError {
  content?: string
  location?: string
}

interface SpotOrderListProps {
  spots: SpotFormData[]
  activeId: string
  onSelect: (id: string) => void
  onActivate?: (id: string) => void
  onRemove: (id: string) => void
  onReorderSpots: (srcIdx: number, targetIdx: number) => void
  onUpdateSpot: (id: string, updates: Partial<SpotFormData>) => void
  spotErrors?: Record<string, SpotError>
  openSpotTextareaIds?: Set<string>
  onClearForceTextarea?: (id: string) => void
}

interface SpotOrderItemProps {
  spot: SpotFormData
  index: number
  isActive: boolean
  isDragOver: boolean
  isDragSrc: boolean
  canRemove: boolean
  onSelect: () => void
  onActivate?: () => void
  onRemove: () => void
  onUpdateSpot: (updates: Partial<SpotFormData>) => void
  error?: SpotError
  forceTextareaOpen?: boolean
  onClearForce?: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onDragEnd: () => void
}

function SpotOrderItem({
  spot,
  index,
  isActive,
  isDragOver,
  isDragSrc,
  canRemove,
  onSelect,
  onActivate,
  onRemove,
  onUpdateSpot,
  error,
  forceTextareaOpen = false,
  onClearForce,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: SpotOrderItemProps) {
  // 코스 순서 항목은 펼친 상태로 진입 — 본문 입력을 한 번 더 펼쳐야 하는 불편 제거
  const [textareaOpen, setTextareaOpen] = useState(true)
  const isTextareaVisible = textareaOpen || forceTextareaOpen
  const gripHeld = useRef(false)

  const borderClass = isActive
    ? 'border-primary bg-primary/5 shadow-sm'
    : isDragOver
    ? 'border-primary border-dashed bg-primary/5'
    : 'border-border-subtle bg-bg-card hover:border-border'

  return (
    <div
      draggable
      onDragStart={(e) => {
        const held = gripHeld.current
        gripHeld.current = false
        if (!held) { e.preventDefault(); return }
        onDragStart(e)
      }}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={() => { gripHeld.current = false; onDragEnd() }}
      className={cn('rounded-xl border-2 transition-all select-none', borderClass, isDragSrc && 'opacity-30')}
    >
      {/* 헤더 행: 번호 + 위치명 + 버튼들 */}
      <div
        className="flex items-center gap-2.5 px-3 py-2 cursor-pointer"
        onClick={onSelect}
      >
        <span className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center text-text-inverse text-nav font-bold shrink-0',
          isActive ? 'bg-primary' : 'bg-gray-300'
        )}>
          {index + 1}
        </span>
        <div className="flex-1 min-w-0 min-h-[2.5rem] flex flex-col justify-center">
          <div className="flex items-center gap-1 min-w-0">
            <p className={cn('text-caption font-medium truncate', spot.location ? 'text-text-emphasis' : 'text-text-disabled')}>
              {spot.location ? spot.location.place_name : `${index + 1}번 위치 미설정`}
            </p>
            {spot.location && (
              <button
                onClick={(e) => { e.stopPropagation(); onUpdateSpot({ location: null }) }}
                className="text-error shrink-0"
                aria-label="위치 삭제"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {spot.location && (
            <p className="text-tiny text-text-disabled truncate mt-0.5">
              {spot.location.road_address_name || spot.location.address_name}
            </p>
          )}
        </div>
        {canRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="text-error hover:text-error/70 transition-colors shrink-0"
            aria-label="스팟 삭제"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (isTextareaVisible) {
              setTextareaOpen(false)
              onClearForce?.()
            } else {
              setTextareaOpen(true)
            }
          }}
          className="text-primary hover:text-primary/80 transition-colors shrink-0"
          aria-label={isTextareaVisible ? '본문 닫기' : '본문 입력'}
        >
          <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', isTextareaVisible && 'rotate-180')} />
        </button>
        <div
          className="text-primary hover:text-primary/80 cursor-grab active:cursor-grabbing shrink-0"
          onMouseDown={(e) => { e.stopPropagation(); gripHeld.current = true }}
        >
          <GripVertical className="w-4 h-4" />
        </div>
      </div>

      {/* 위치 검색 */}
      <div
        className="px-3 pb-2"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onFocus={onActivate}
      >
        <LocationSearch
          value={spot.location ? [spot.location] : []}
          onChange={(places) => onUpdateSpot({ location: places[0] ?? null })}
          singleMode
          hasError={!!error?.location}
        />
        {error?.location && (
          <span className="block mt-1 text-caption text-(--input-text-error)">{error.location}</span>
        )}
      </div>

      {/* 본문 textarea (토글) */}
      {isTextareaVisible && (
        <div
          className="px-3 pb-3"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="relative">
            <textarea
              value={spot.content}
              onChange={(e) => onUpdateSpot({ content: e.target.value })}
              placeholder="이 장소에서의 이야기를 들려주세요..."
              maxLength={500}
              rows={4}
              className={cn(
                'w-full px-3 py-2.5 rounded-xl border text-body-sm outline-none transition-colors resize-none bg-white',
                error?.content ? 'border-(--input-border-error)' : 'border-border focus:border-primary'
              )}
            />
            <span className="absolute bottom-3 right-3 text-nav text-text-disabled">
              {spot.content.length}/500
            </span>
          </div>
          {error?.content && (
            <span className="block mt-1 text-caption text-(--input-text-error)">{error.content}</span>
          )}
        </div>
      )}

      {/* 토글 닫힌 상태에서도 본문 에러 표시 */}
      {!isTextareaVisible && error?.content && (
        <div className="px-3 pb-3" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
          <span className="block text-caption text-(--input-text-error)">{error.content}</span>
        </div>
      )}
    </div>
  )
}

export default function SpotOrderList({
  spots,
  activeId,
  onSelect,
  onActivate,
  onRemove,
  onReorderSpots,
  onUpdateSpot,
  spotErrors = {},
  openSpotTextareaIds,
  onClearForceTextarea,
}: SpotOrderListProps) {
  const {
    state: { dragSrc, dragOver },
    handlers: { handleDragStart, handleDragOver, handleDrop, handleDragEnd },
  } = useDragReorder(onReorderSpots)

  return (
    <div className="flex flex-col gap-1.5">
      {spots.map((spot, i) => (
        <SpotOrderItem
          key={spot.id}
          spot={spot}
          index={i}
          isActive={spot.id === activeId}
          isDragOver={dragOver === i}
          isDragSrc={dragSrc === i}
          canRemove={spots.length > 1 && i > 0}
          onSelect={() => onSelect(spot.id)}
          onActivate={onActivate ? () => onActivate(spot.id) : undefined}
          onRemove={() => onRemove(spot.id)}
          onUpdateSpot={(updates) => onUpdateSpot(spot.id, updates)}
          error={spotErrors[spot.id]}
          forceTextareaOpen={openSpotTextareaIds?.has(spot.id) ?? false}
          onClearForce={() => onClearForceTextarea?.(spot.id)}
          onDragStart={(e) => handleDragStart(e, i)}
          onDragOver={(e) => handleDragOver(e, i)}
          onDrop={(e) => handleDrop(e, i)}
          onDragEnd={handleDragEnd}
        />
      ))}
    </div>
  )
}
