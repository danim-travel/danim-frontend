'use client'

import { useRef } from 'react'
import { Loader2, Upload } from 'lucide-react'
import type { SpotFormData } from '../_hooks/useWriteForm'
import { useDragReorder } from '../_hooks/useDragReorder'
import { MAX_PHOTOS } from '../_constants'

interface PhotosState {
  selectedPhotoIdx: number
  isUploadingPhoto: boolean
  uploadProgress: { current: number; total: number }
  onSelectPhoto: (idx: number) => void
  onPhotoAdd: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemovePhoto: (idx: number) => void
  onReorderPhotos: (srcIdx: number, targetIdx: number) => void
}

interface PhotoPanelProps {
  active: SpotFormData
  photosState: PhotosState
  photoError?: string
}

const getPhotoContainerClass = (isEmpty: boolean, hasError: boolean) =>
  isEmpty
    ? `border-dashed cursor-pointer flex flex-col items-center justify-center gap-4 ${
        hasError
          ? 'border-(--input-border-error) bg-error/5'
          : 'border-border hover:border-primary hover:bg-primary/5'
      }`
    : 'border-transparent'

export default function PhotoPanel({ active, photosState, photoError }: PhotoPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    selectedPhotoIdx,
    isUploadingPhoto,
    uploadProgress,
    onSelectPhoto,
    onPhotoAdd,
    onRemovePhoto,
    onReorderPhotos,
  } = photosState
  const {
    state: { dragSrc, dragOver },
    handlers: { handleDragStart, handleDragOver, handleDrop, handleDragEnd },
  } = useDragReorder((srcIdx, targetIdx) => {
    onReorderPhotos(srcIdx, targetIdx)
    onSelectPhoto(targetIdx)
  })

  const isEmpty = active.previewUrls.length === 0
  const hasPhotoError = isEmpty && Boolean(photoError)

  return (
    <div className="w-full flex flex-col gap-3 px-4 pt-4 pb-3 md:w-[44%] md:shrink-0 md:border-r md:border-border-subtle md:p-5 md:bg-bg-subtle/50">
      <div
        className={`w-full aspect-[4/3] rounded-2xl border-2 overflow-hidden relative transition-all md:w-auto md:flex-1 md:aspect-auto ${getPhotoContainerClass(isEmpty, hasPhotoError)}`}
        onClick={() => isEmpty && fileInputRef.current?.click()}
      >
        {!isEmpty ? (
          <div className="w-full h-full relative rounded-2xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.previewUrls[selectedPhotoIdx] ?? active.previewUrls[0]}
              alt="preview"
              className="w-full h-full object-cover"
            />
            {active.previewUrls.length > 1 && (
              <span className="absolute bottom-3 right-3 bg-black/55 backdrop-blur-sm text-text-inverse text-nav px-2.5 py-1 rounded-full font-medium">
                {selectedPhotoIdx + 1} / {active.previewUrls.length}
              </span>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm text-text-inverse flex items-center justify-center hover:bg-black/60 transition-colors text-lg leading-none"
            >
              +
            </button>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-bg flex items-center justify-center">
              {isUploadingPhoto ? (
                <Loader2 className="w-6 h-6 text-primary animate-spin" strokeWidth={1.5} />
              ) : (
                <Upload className="w-6 h-6 text-text-disabled" strokeWidth={1.5} />
              )}
            </div>
            <div className="text-center px-6">
              <p className="text-body-sm font-semibold text-text-body">
                {isUploadingPhoto
                  ? uploadProgress.total > 1
                    ? `업로드 중... (${uploadProgress.current} / ${uploadProgress.total})`
                    : '업로드 중...'
                  : '사진 업로드'}
              </p>
              {!isUploadingPhoto && (
                <p className="text-nav text-text-disabled mt-1.5 leading-relaxed">
                  클릭하거나 파일을 드래그하세요
                  <br />
                  이미지 파일 (SVG · GIF 제외) · 최대 5장
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onPhotoAdd}
      />

      {hasPhotoError && (
        <span className="text-caption text-(--input-text-error)">{photoError}</span>
      )}

      {/* Thumbnails */}
      {!isEmpty && (
        <div className="flex gap-2 items-center">
          {active.previewUrls.map((url, i) => (
            <div
              key={`${active.id}-${i}`}
              draggable
              onDragStart={(e) => handleDragStart(e, i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
              onClick={() => onSelectPhoto(i)}
              className={`relative group cursor-pointer transition-all select-none shrink-0 ${
                dragSrc === i ? 'opacity-30' : ''
              } ${dragOver === i && dragSrc !== i ? 'scale-110' : ''}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className={`w-14 h-14 rounded-xl object-cover border-2 transition-all ${
                  selectedPhotoIdx === i
                    ? 'border-primary ring-2 ring-primary/25'
                    : 'border-transparent hover:border-border-strong'
                }`}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemovePhoto(i)
                }}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-text-secondary text-text-inverse rounded-full text-tiny hidden group-hover:flex items-center justify-center shadow-sm"
              >
                ×
              </button>
            </div>
          ))}
          {active.previewUrls.length < MAX_PHOTOS && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-14 h-14 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-text-placeholder hover:border-primary hover:text-primary transition-colors text-2xl shrink-0"
            >
              +
            </button>
          )}
        </div>
      )}
    </div>
  )
}
