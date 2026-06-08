'use client'

import { Check } from 'lucide-react'
import type { SpotFormData } from '../_hooks/useWriteForm'

interface ThumbnailPickerProps {
  spots: SpotFormData[]
  thumbnailKey: string | null
  onSelect: (key: string) => void
}

export default function ThumbnailPicker({ spots, thumbnailKey, onSelect }: ThumbnailPickerProps) {
  // 모든 스팟의 이미지를 하나의 배열로 flatten — 스팟 번호(spotIdx)와 사진 인덱스(photoIdx)를 함께 보존
  const allImages = spots.flatMap((spot, spotIdx) =>
    spot.images.map((img, photoIdx) => ({ spot, spotIdx, img, photoIdx }))
  )
  const hasAnyPhoto = allImages.length > 0

  if (!hasAnyPhoto) {
    return (
      <div className="w-full px-4 py-3 rounded-xl border border-dashed border-border text-caption text-text-disabled text-center">
        사진을 업로드하면 썸네일을 선택할 수 있어요
      </div>
    )
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {allImages.map(({ spot, spotIdx, img, photoIdx }) => {
        const isSelected = thumbnailKey === img.key
        // 로컬 blob URL이 있으면 우선 사용, 없으면 S3 URL로 폴백
        const previewUrl = spot.previewUrls[photoIdx] ?? img.original_img
        return (
          <button
            key={`${spot.id}-${img.key}`}
            onClick={() => onSelect(img.key)}
            className="relative shrink-0 group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt=""
              className={`w-16 h-16 rounded-xl object-cover border-2 transition-all ${
                isSelected
                  ? 'border-primary ring-2 ring-primary/25'
                  : 'border-transparent hover:border-border-strong'
              }`}
            />
            <span className="absolute bottom-1 left-1 bg-black/50 text-text-inverse text-[9px] font-bold px-1 py-0.5 rounded-md leading-none">
              {spotIdx + 1}
            </span>
            {isSelected && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center shadow">
                <Check className="w-2.5 h-2.5 text-text-inverse" strokeWidth={3} />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
