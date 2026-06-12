'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, FieldLabel } from '@/components/common'
import { useWriteForm } from './_hooks/useWriteForm'
import PhotoPanel from './_components/PhotoPanel'
import SpotOrderList from './_components/SpotOrderList'
import SpotIndicatorBar from './_components/SpotIndicatorBar'
import ThumbnailPicker from './_components/ThumbnailPicker'
import WriteHeader from './_components/WriteHeader'
import TitleSection from './_components/TitleSection'
import DescriptionSection from './_components/DescriptionSection'
import SpotContentSection from './_components/SpotContentSection'
import { MAX_SPOTS } from './_constants'

export default function WritePage() {
  const router = useRouter()
  const { title, setTitle, description, setDescription, spot, photo, submit } = useWriteForm()

  const { submitPost, canSubmit, isSubmitting } = submit

  const [titleError, setTitleError] = useState<string | undefined>()
  const [descriptionError, setDescriptionError] = useState<string | undefined>()
  const [spotContentError, setSpotContentError] = useState<string | undefined>()
  const [spotLocationError, setSpotLocationError] = useState<string | undefined>()
  const [spotPhotoError, setSpotPhotoError] = useState<string | undefined>()

  const handleSubmit = useCallback(async () => {
    setTitleError(title.trim().length === 0 ? "제목을 입력해주세요" : undefined)
    setDescriptionError(description.trim().length === 0 ? "한 줄 소개를 입력해주세요" : undefined)

    // 유효하지 않은 첫 번째 스팟으로 전환 후 해당 스팟 기준으로 에러 표시
    const invalidSpot = spot.spots.find(
      (s) => s.content.trim().length === 0 || s.location === null || s.images.length === 0
    )
    if (invalidSpot) spot.selectSpot(invalidSpot.id)

    const target = invalidSpot ?? spot.active
    setSpotContentError(target.content.trim().length === 0 ? "본문을 입력해주세요" : undefined)
    setSpotLocationError(target.location === null ? "위치를 입력해주세요" : undefined)
    setSpotPhotoError(target.images.length === 0 ? "사진을 최소 1장 추가해주세요" : undefined)

    if (!canSubmit) return

    const ok = await submitPost()
    if (ok) router.push('/')
  }, [submitPost, canSubmit, router, title, description, spot])

  const handleCancel = useCallback(() => router.back(), [router])

  const clearSpotErrors = useCallback(() => {
    setSpotContentError(undefined)
    setSpotLocationError(undefined)
    setSpotPhotoError(undefined)
  }, [])

  // 사용자가 직접 마커를 전환할 때 스팟 에러 초기화
  const handleSelectSpot = useCallback((id: string) => {
    spot.selectSpot(id)
    clearSpotErrors()
  }, [spot, clearSpotErrors])

  const handleRemoveSpot = useCallback((id: string) => {
    spot.removeSpot(id)
    clearSpotErrors()
  }, [spot, clearSpotErrors])

  return (
    <div className="h-full flex flex-col bg-white">
      <WriteHeader onCancel={handleCancel} />

      {/* Main */}
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

            <SpotContentSection
              active={spot.active}
              activeIdx={spot.activeIdx}
              updateSpot={spot.updateSpot}
              contentError={spotContentError}
              locationError={spotLocationError}
            />

            {/* 코스 순서 */}
            <div>
              <FieldLabel>코스 순서</FieldLabel>
              <SpotOrderList
                spots={spot.spots}
                activeId={spot.activeId}
                onSelect={handleSelectSpot}
                onRemove={handleRemoveSpot}
                onReorderSpots={spot.reorderSpots}
              />
            </div>

            {/* 썸네일 */}
            <div>
              <FieldLabel>썸네일</FieldLabel>
              <ThumbnailPicker
                spots={spot.spots}
                thumbnailKey={photo.thumbnailKey}
                onSelect={photo.setThumbnailKey}
              />
            </div>
          </div>
        </div>
      </div>

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
