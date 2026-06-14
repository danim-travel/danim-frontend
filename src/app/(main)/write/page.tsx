'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, FieldLabel, Modal } from '@/components/common'
import { useWriteForm } from './_hooks/useWriteForm'
import PhotoPanel from './_components/PhotoPanel'
import SpotOrderList, { type SpotError } from './_components/SpotOrderList'
import SpotIndicatorBar from './_components/SpotIndicatorBar'
import ThumbnailPicker from './_components/ThumbnailPicker'
import WriteHeader from './_components/WriteHeader'
import TitleSection from './_components/TitleSection'
import DescriptionSection from './_components/DescriptionSection'
import { MAX_SPOTS } from './_constants'

export default function WritePage() {
  const router = useRouter()
  const { title, setTitle, description, setDescription, spot, photo, submit } = useWriteForm()

  const { submitPost, canSubmit, isSubmitting } = submit

  const [titleError, setTitleError] = useState<string | undefined>()
  const [descriptionError, setDescriptionError] = useState<string | undefined>()
  const [spotPhotoError, setSpotPhotoError] = useState<string | undefined>()
  const [spotErrors, setSpotErrors] = useState<Record<string, SpotError>>({})
  const [confirmRemoveSpotId, setConfirmRemoveSpotId] = useState<string | null>(null)

  const handleSubmit = useCallback(async () => {
    setTitleError(title.trim().length === 0 ? "제목을 입력해주세요" : undefined)
    setDescriptionError(description.trim().length === 0 ? "한 줄 소개를 입력해주세요" : undefined)

    const newSpotErrors: Record<string, SpotError> = {}
    for (const s of spot.spots) {
      const err: SpotError = {}
      if (s.content.trim().length === 0) err.content = "본문을 입력해주세요"
      if (s.location === null) err.location = "위치를 입력해주세요"
      if (Object.keys(err).length > 0) newSpotErrors[s.id] = err
    }
    setSpotErrors(newSpotErrors)

    const invalidSpot = spot.spots.find(
      (s) => s.content.trim().length === 0 || s.location === null || s.images.length === 0
    )
    if (invalidSpot) {
      spot.selectSpot(invalidSpot.id)
      setSpotPhotoError(invalidSpot.images.length === 0 ? "사진을 최소 1장 추가해주세요" : undefined)
    } else {
      setSpotPhotoError(undefined)
    }

    if (!canSubmit) return

    const ok = await submitPost()
    if (ok) router.push('/')
  }, [submitPost, canSubmit, router, title, description, spot])

  const handleCancel = useCallback(() => router.back(), [router])

  const clearErrors = useCallback(() => {
    setSpotErrors({})
    setSpotPhotoError(undefined)
  }, [])

  const handleSelectSpot = useCallback((id: string) => {
    spot.selectSpot(id)
    clearErrors()
  }, [spot, clearErrors])

  const handleRequestRemoveSpot = useCallback((id: string) => {
    setConfirmRemoveSpotId(id)
  }, [])

  const handleConfirmRemoveSpot = useCallback(() => {
    if (confirmRemoveSpotId) {
      spot.removeSpot(confirmRemoveSpotId)
      clearErrors()
      setConfirmRemoveSpotId(null)
    }
  }, [confirmRemoveSpotId, spot, clearErrors])

  const handleRemoveSpot = handleRequestRemoveSpot

  const handleUpdateSpot = useCallback((id: string, updates: Parameters<typeof spot.updateSpot>[1]) => {
    spot.updateSpot(id, updates)
    clearErrors()
  }, [spot, clearErrors])

  return (
    <div className="h-full flex flex-col bg-white">
      <WriteHeader onCancel={handleCancel} />

      {/* min-h-0: flex child는 기본 min-height가 auto라 overflow-hidden이 동작하지 않음 — 명시적 0으로 해제 */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: Photo */}
        <PhotoPanel
          active={spot.active}
          photoError={spotPhotoError}
          photosState={{
            selectedPhotoIdx: photo.selectedPhotoIdx,
            isUploadingPhoto: photo.isUploadingPhoto,
            onPhotoAdd: photo.handlePhotoAdd,
            onRemovePhoto: photo.removePhoto,
            onSelectPhoto: photo.setSelectedPhotoIdx,
            onReorderPhotos: photo.reorderPhotos,
          }}
        />

        {/* Right: Form */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-7 py-4 flex flex-col gap-4">
            <TitleSection title={title} setTitle={setTitle} error={titleError} />
            <DescriptionSection description={description} setDescription={setDescription} error={descriptionError} />

            {/* 썸네일 */}
            <div>
              <FieldLabel>썸네일</FieldLabel>
              <ThumbnailPicker
                spots={spot.spots}
                thumbnailKey={photo.thumbnailKey}
                onSelect={photo.setThumbnailKey}
              />
            </div>

            {/* 코스 순서 */}
            <div>
              <FieldLabel>코스 순서</FieldLabel>
              <SpotOrderList
                spots={spot.spots}
                activeId={spot.activeId}
                onSelect={handleSelectSpot}
                onRemove={handleRemoveSpot}
                onReorderSpots={spot.reorderSpots}
                onUpdateSpot={handleUpdateSpot}
                spotErrors={spotErrors}
              />
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={confirmRemoveSpotId !== null}
        onClose={() => setConfirmRemoveSpotId(null)}
        title="위치 삭제"
        className="max-w-sm"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setConfirmRemoveSpotId(null)}>취소</Button>
            <Button variant="outline" size="md" className="text-error border-error hover:bg-error/5" onClick={handleConfirmRemoveSpot}>삭제</Button>
          </>
        }
      >
        <p className="text-body-sm text-text-body">이 위치를 삭제할까요? 입력한 내용이 모두 사라집니다.</p>
      </Modal>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-7 py-4 border-t border-border-subtle bg-white shrink-0">
        <SpotIndicatorBar
          spots={spot.spots}
          activeId={spot.activeId}
          maxSpots={MAX_SPOTS}
          onSelect={handleSelectSpot}
          onAdd={spot.addSpot}
          onRemove={handleRemoveSpot}
        />

        <Button
          variant="primary"
          size="md"
          onClick={handleSubmit}
          disabled={isSubmitting}
          loading={isSubmitting}
        >
          게시하기
        </Button>
      </div>
    </div>
  )
}
