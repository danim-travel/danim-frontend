'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'
import { FieldLabel } from '@/components/common'
import type { SpotFormData } from '../_hooks/useWriteForm'

const LocationSearch = dynamic(() => import('./LocationSearch'), { ssr: false })

interface SpotContentSectionProps {
  active: SpotFormData
  activeIdx: number
  updateSpot: (id: string, updates: Partial<SpotFormData>) => void
  contentError?: string
  locationError?: string
}

const SpotContentSection = memo(function SpotContentSection({
  active,
  activeIdx,
  updateSpot,
  contentError,
  locationError,
}: SpotContentSectionProps) {
  const hasContentError = Boolean(contentError)

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-2">
          <FieldLabel required>본문</FieldLabel>
          <span className="text-nav text-text-placeholder">{activeIdx + 1}번 위치</span>
        </div>
        <div className="relative">
          {/* key로 spot 전환 시 textarea를 강제 리마운트 — 이전 spot 입력값이 남는 DOM 상태 초기화 */}
          <textarea
            key={active.id}
            value={active.content}
            onChange={(e) => updateSpot(active.id, { content: e.target.value })}
            placeholder="이 장소에서의 이야기를 들려주세요..."
            autoComplete="off"
            maxLength={500}
            rows={5}
            className={cn(
              "w-full px-4 py-3 rounded-xl border text-body-sm outline-none transition-colors resize-none bg-white",
              hasContentError
                ? "border-(--input-border-error)"
                : "border-border focus:border-primary"
            )}
          />
          <span className="absolute bottom-3 right-4 text-nav text-text-disabled">
            {active.content.length}/500
          </span>
        </div>
        {hasContentError && (
          <span className="block mt-2 text-caption text-(--input-text-error)">
            {contentError}
          </span>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <FieldLabel required>위치 / 장소</FieldLabel>
          <span className="text-nav text-text-placeholder">{activeIdx + 1}번 위치</span>
        </div>
        {/* key로 spot 전환 시 검색 입력·결과 상태 초기화 */}
        <LocationSearch
          key={active.id}
          value={active.location ? [active.location] : []}
          onChange={(places) => updateSpot(active.id, { location: places[0] ?? null })}
          singleMode
        />
        {locationError && (
          <span className="block mt-2 text-caption text-(--input-text-error)">
            {locationError}
          </span>
        )}
      </div>
    </>
  )
})

export default SpotContentSection
