'use client'

import { useCallback, useRef, useState } from 'react'
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
  // 스팟별 사진 누락 에러를 영속 보관 — 활성 스팟 전환과 무관하게 각 스팟의 에러 표시 유지
  const [spotPhotoErrors, setSpotPhotoErrors] = useState<Record<string, string>>({})
  const [spotErrors, setSpotErrors] = useState<Record<string, SpotError>>({})
  const [openSpotTextareaIds, setOpenSpotTextareaIds] = useState<Set<string>>(new Set())
  const [confirmRemoveSpotId, setConfirmRemoveSpotId] = useState<string | null>(null)

  const titleSectionRef = useRef<HTMLDivElement>(null)
  const descriptionSectionRef = useRef<HTMLDivElement>(null)
  const spotSectionRef = useRef<HTMLDivElement>(null)
  const photoSectionRef = useRef<HTMLDivElement>(null)

  const handleSubmit = useCallback(async () => {
    const hasTitleError = title.trim().length === 0
    const hasDescriptionError = description.trim().length === 0
    setTitleError(hasTitleError ? "제목을 입력해주세요" : undefined)
    setDescriptionError(hasDescriptionError ? "한 줄 소개를 입력해주세요" : undefined)

    // 제목 → 한줄소개 우선순위로 첫 미입력 필드로 스크롤
    if (hasTitleError) {
      titleSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else if (hasDescriptionError) {
      descriptionSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const newSpotErrors: Record<string, SpotError> = {}
    const newOpenIds = new Set<string>()
    for (const s of spot.spots) {
      const err: SpotError = {}
      if (s.content.trim().length === 0) err.content = "본문을 입력해주세요"
      if (s.location === null) err.location = "위치를 입력해주세요"
      if (Object.keys(err).length > 0) {
        newSpotErrors[s.id] = err
        if (err.content) newOpenIds.add(s.id)
      }
    }
    setSpotErrors(newSpotErrors)
    setOpenSpotTextareaIds(newOpenIds)

    // 사진 누락 에러는 모든 스팟에 대해 일괄 산출하여 보관 — 어느 스팟으로 이동해도 해당 스팟의 상태 그대로 노출
    const newPhotoErrors: Record<string, string> = {}
    for (const s of spot.spots) {
      if (s.images.length === 0) newPhotoErrors[s.id] = "사진을 최소 1장 추가해주세요"
    }
    setSpotPhotoErrors(newPhotoErrors)

    const invalidSpot = spot.spots.find(
      (s) => s.content.trim().length === 0 || s.location === null || s.images.length === 0
    )
    if (invalidSpot) {
      spot.selectSpot(invalidSpot.id)
      // 제목·한줄소개 오류가 없을 때만 스팟/사진 영역으로 스크롤
      if (!hasTitleError && !hasDescriptionError) {
        const hasContentOrLocationError =
          invalidSpot.content.trim().length === 0 || invalidSpot.location === null
        if (hasContentOrLocationError) {
          spotSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } else if (invalidSpot.images.length === 0) {
          photoSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    }

    if (!canSubmit) return

    const ok = await submitPost()
    if (ok) router.push('/mypage')
  }, [submitPost, canSubmit, router, title, description, spot])

  const handleCancel = useCallback(() => router.back(), [router])

  // 사진을 추가하면 현재 활성 스팟의 사진 에러만 해제 — 다른 스팟의 에러는 그대로 유지
  const activeSpotId = spot.active.id
  const handlePhotoAdd = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    photo.handlePhotoAdd(e)
    setSpotPhotoErrors((prev) => {
      if (!prev[activeSpotId]) return prev
      const next = { ...prev }
      delete next[activeSpotId]
      return next
    })
  }, [photo, activeSpotId])

  // 삭제된 스팟에 묶여 있던 에러만 정리 — 다른 스팟의 에러는 유지
  const removeSpotErrors = useCallback((id: string) => {
    setSpotErrors(prev => {
      if (!prev[id]) return prev
      const { [id]: _removed, ...rest } = prev
      return rest
    })
    setSpotPhotoErrors(prev => {
      if (!prev[id]) return prev
      const { [id]: _removed, ...rest } = prev
      return rest
    })
    setOpenSpotTextareaIds(prev => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  // 스팟 전환은 에러 상태에 영향 없음 — 각 스팟의 에러는 그 스팟이 수정될 때까지 유지
  const handleSelectSpot = useCallback((id: string) => {
    spot.selectSpot(id)
  }, [spot])

  const handleActivateSpot = useCallback((id: string) => {
    spot.selectSpot(id)
  }, [spot])

  const handleRequestRemoveSpot = useCallback((id: string) => {
    setConfirmRemoveSpotId(id)
  }, [])

  const handleConfirmRemoveSpot = useCallback(() => {
    if (confirmRemoveSpotId) {
      spot.removeSpot(confirmRemoveSpotId)
      // 삭제된 스팟의 에러만 정리, 나머지는 보존
      removeSpotErrors(confirmRemoveSpotId)
      setConfirmRemoveSpotId(null)
    }
  }, [confirmRemoveSpotId, spot, removeSpotErrors])

  const handleRemoveSpot = handleRequestRemoveSpot

  const handleClearForceTextarea = useCallback((id: string) => {
    setOpenSpotTextareaIds(prev => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  // 해당 필드를 사용자가 채웠을 때만 그 필드의 에러를 해제 — 다른 스팟·다른 필드 에러는 그대로
  const handleUpdateSpot = useCallback((id: string, updates: Parameters<typeof spot.updateSpot>[1]) => {
    spot.updateSpot(id, updates)
    setSpotErrors(prev => {
      const current = prev[id]
      if (!current) return prev
      const next: SpotError = { ...current }
      if (updates.content !== undefined && updates.content.trim().length > 0) delete next.content
      if (updates.location !== undefined && updates.location !== null) delete next.location
      if (Object.keys(next).length === 0) {
        const { [id]: _removed, ...rest } = prev
        return rest
      }
      return { ...prev, [id]: next }
    })
  }, [spot])

  return (
    <div className="h-full flex flex-col bg-white">
      <WriteHeader onCancel={handleCancel} />

      {/* 모바일: 단일 컬럼 스크롤 / 데스크탑(md+): 사진 좌측 고정 + 폼 우측 스크롤 2단 */}
      <div className="flex-1 min-h-0 overflow-y-auto md:flex md:overflow-hidden">
        {/* 사진 업로드 — 모바일에서 사진 오류 시 스크롤 타깃, 데스크탑에서는 contents로 레이아웃 영향 없음 */}
        <div ref={photoSectionRef} className="scroll-mt-4 md:contents">
          <PhotoPanel
            active={spot.active}
            photoError={spotPhotoErrors[spot.active.id]}
            photosState={{
              selectedPhotoIdx: photo.selectedPhotoIdx,
              isUploadingPhoto: photo.isUploadingPhoto,
              uploadProgress: photo.uploadProgress,
              onPhotoAdd: handlePhotoAdd,
              onRemovePhoto: photo.removePhoto,
              onSelectPhoto: photo.setSelectedPhotoIdx,
              onReorderPhotos: photo.reorderPhotos,
            }}
          />
        </div>

        {/* 폼 필드: 모바일은 부모 스크롤 내 / 데스크탑은 자체 스크롤 컬럼 */}
        <div className="px-4 pb-6 flex flex-col gap-5 md:flex-1 md:overflow-y-auto md:px-7 md:py-4 md:pb-4 md:gap-4">
          <div ref={titleSectionRef} className="scroll-mt-4">
            <TitleSection title={title} setTitle={setTitle} error={titleError} />
          </div>
          <div ref={descriptionSectionRef} className="scroll-mt-4">
            <DescriptionSection description={description} setDescription={setDescription} error={descriptionError} />
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

          {/* 코스 순서 */}
          <div ref={spotSectionRef} className="scroll-mt-4">
            <FieldLabel>코스 순서</FieldLabel>
            <SpotOrderList
              spots={spot.spots}
              activeId={spot.activeId}
              onSelect={handleSelectSpot}
              onActivate={handleActivateSpot}
              onRemove={handleRemoveSpot}
              onReorderSpots={spot.reorderSpots}
              onUpdateSpot={handleUpdateSpot}
              spotErrors={spotErrors}
              openSpotTextareaIds={openSpotTextareaIds}
              onClearForceTextarea={handleClearForceTextarea}
            />
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
