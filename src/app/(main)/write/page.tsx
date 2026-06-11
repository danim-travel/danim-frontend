'use client'

import { useCallback } from 'react'
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
  const handleSubmit = useCallback(async () => {
    const ok = await submitPost()
    if (ok) router.push('/')
  }, [submitPost, router])

  const handleCancel = useCallback(() => router.back(), [router])

  return (
    <div className="h-full flex flex-col bg-white">
      <WriteHeader onCancel={handleCancel} />

      {/* Main */}
      {/* min-h-0: flex child는 기본 min-height가 auto라 overflow-hidden이 동작하지 않음 — 명시적 0으로 해제 */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: Photo */}
        <PhotoPanel
          active={spot.active}
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
            <TitleSection title={title} setTitle={setTitle} />
            <DescriptionSection description={description} setDescription={setDescription} />

            <SpotContentSection
              active={spot.active}
              activeIdx={spot.activeIdx}
              updateSpot={spot.updateSpot}
            />

            {/* 코스 순서 */}
            <div>
              <FieldLabel>코스 순서</FieldLabel>
              <SpotOrderList
                spots={spot.spots}
                activeId={spot.activeId}
                onSelect={spot.selectSpot}
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
          onSelect={spot.selectSpot}
          onAdd={spot.addSpot}
        />

        <Button
          variant="primary"
          size="md"
          onClick={handleSubmit}
          disabled={!canSubmit}
          loading={isSubmitting}
        >
          게시하기
        </Button>
      </div>
    </div>
  )
}
