'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { queryKeys } from '@/lib/queryKeys'
import { getApiErrorMessage } from '@/lib/apiError'
import { toast } from '@/store/toastStore'
import { Button, FieldLabel, Modal } from '@/components/common'
import { Spinner } from '@/components/ui/spinner'
import type { PostDetail } from '@/types'
import { useWriteForm } from '../../_hooks/useWriteForm'
import { usePostEdit } from '../../_hooks/usePostEdit'
import { buildPostPayload } from '../../_helpers/postPayload.helper'
import { hasImageWithoutSize } from '../../_helpers/imageSize.helper'
import PhotoPanel from '../../_components/PhotoPanel'
import SpotOrderList, { type SpotError } from '../../_components/SpotOrderList'
import SpotIndicatorBar from '../../_components/SpotIndicatorBar'
import ThumbnailPicker from '../../_components/ThumbnailPicker'
import WriteHeader from '../../_components/WriteHeader'
import TitleSection from '../../_components/TitleSection'
import DescriptionSection from '../../_components/DescriptionSection'
import { MAX_SPOTS, BUILD_PAYLOAD_ERROR_MESSAGE } from '../../_constants'

export default function EditPostPage() {
  const router = useRouter()
  const params = useParams<{ postId: string }>()
  const postId = params.postId

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.posts.detail(postId),
    queryFn: () => apiClient.get(`posts/${postId}`).json<PostDetail>(),
    enabled: !!postId,
    refetchOnWindowFocus: false,
  })

  const goBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back()
    else router.replace('/mypage')
  }, [router])

  // 조회 실패 시 토스트 후 마이페이지로 이동
  useEffect(() => {
    if (isError) {
      toast.error(getApiErrorMessage(error, { client: '게시글을 불러올 수 없습니다.' }))
      router.replace('/mypage')
    }
  }, [isError, error, router])

  // 데이터 도착 후 수정 불가 사유를 검사한다. 사유가 겹쳐도 안내는 하나만 노출되도록 한 곳에서 판단한다.
  // 이미지 크기가 없는 게시글은 수정 요청이 백엔드 검증(최솟값 1)을 통과할 수 없어,
  // 폼을 채우게 두면 저장 시점에야 원인 불명의 실패를 겪는다. 진입 단계에서 미리 안내한다.
  useEffect(() => {
    if (!data) return
    if (data.is_owner === false) {
      toast.error('본인 게시글만 수정할 수 있습니다.')
      router.replace('/mypage')
    } else if (hasImageWithoutSize(data)) {
      toast.error('이미지 정보가 없어 수정할 수 없는 게시글입니다.')
      router.replace('/mypage')
    }
  }, [data, router])

  if (isLoading || !data) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <Spinner size="lg" />
      </div>
    )
  }

  // 위 useEffect가 리다이렉트를 예약했더라도 이번 렌더는 그대로 진행되므로,
  // 수정 불가 게시글의 폼이 한 프레임 깜빡이지 않도록 여기서도 막는다.
  if (data.is_owner === false || hasImageWithoutSize(data)) {
    return null
  }

  return <EditPostForm postId={postId} initial={data} onCancel={goBack} onCompleted={goBack} />
}

type EditPostFormProps = {
  postId: string
  initial: PostDetail
  onCancel: () => void
  onCompleted: () => void
}

function EditPostForm({ postId, initial, onCancel, onCompleted }: EditPostFormProps) {
  const { title, setTitle, description, setDescription, spot, photo } = useWriteForm({ initial })
  const { editPost, isEditing } = usePostEdit(postId)

  const [titleError, setTitleError] = useState<string | undefined>()
  const [descriptionError, setDescriptionError] = useState<string | undefined>()
  const [spotPhotoError, setSpotPhotoError] = useState<string | undefined>()
  const [spotErrors, setSpotErrors] = useState<Record<string, SpotError>>({})
  const [openSpotTextareaIds, setOpenSpotTextareaIds] = useState<Set<string>>(new Set())
  const [confirmRemoveSpotId, setConfirmRemoveSpotId] = useState<string | null>(null)

  // 작성과 동일한 검증 정책
  const canSubmit =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    spot.spots.every((s) => s.content.trim().length > 0 && s.location !== null && s.images.length > 0) &&
    photo.thumbnailKey !== null &&
    !isEditing

  const handleSubmit = useCallback(async () => {
    setTitleError(title.trim().length === 0 ? '제목을 입력해주세요' : undefined)
    setDescriptionError(description.trim().length === 0 ? '한 줄 소개를 입력해주세요' : undefined)

    const newSpotErrors: Record<string, SpotError> = {}
    const newOpenIds = new Set<string>()
    for (const s of spot.spots) {
      const err: SpotError = {}
      if (s.content.trim().length === 0) err.content = '본문을 입력해주세요'
      if (s.location === null) err.location = '위치를 입력해주세요'
      if (Object.keys(err).length > 0) {
        newSpotErrors[s.id] = err
        if (err.content) newOpenIds.add(s.id)
      }
    }
    setSpotErrors(newSpotErrors)
    setOpenSpotTextareaIds(newOpenIds)

    const invalidSpot = spot.spots.find(
      (s) => s.content.trim().length === 0 || s.location === null || s.images.length === 0,
    )
    if (invalidSpot) {
      spot.selectSpot(invalidSpot.id)
      setSpotPhotoError(invalidSpot.images.length === 0 ? '사진을 최소 1장 추가해주세요' : undefined)
    } else {
      setSpotPhotoError(undefined)
    }

    if (!canSubmit || photo.thumbnailKey === null) return

    const result = buildPostPayload({
      title,
      description,
      spots: spot.spots,
      thumbnailKey: photo.thumbnailKey,
    })
    if (!result.ok) {
      toast.error(BUILD_PAYLOAD_ERROR_MESSAGE[result.reason])
      return
    }

    try {
      await editPost(result.payload)
      toast.success('게시글이 수정되었습니다.')
      onCompleted()
    } catch {
      // usePostEdit onError에서 토스트 처리
    }
  }, [title, description, spot, canSubmit, photo.thumbnailKey, editPost, onCompleted])

  const clearErrors = useCallback(() => {
    setSpotErrors({})
    setSpotPhotoError(undefined)
    setOpenSpotTextareaIds(new Set())
  }, [])

  const handleSelectSpot = useCallback(
    (id: string) => {
      spot.selectSpot(id)
      clearErrors()
    },
    [spot, clearErrors],
  )

  const handleActivateSpot = useCallback(
    (id: string) => {
      spot.selectSpot(id)
    },
    [spot],
  )

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

  const handleClearForceTextarea = useCallback((id: string) => {
    setOpenSpotTextareaIds((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  const handleUpdateSpot = useCallback(
    (id: string, updates: Parameters<typeof spot.updateSpot>[1]) => {
      spot.updateSpot(id, updates)
      setSpotErrors((prev) => {
        if (!prev[id]) return prev
        const { [id]: _, ...rest } = prev
        return rest
      })
    },
    [spot],
  )

  return (
    <div className="h-full flex flex-col bg-white">
      <WriteHeader
        onCancel={onCancel}
        title="여행 기록 수정하기"
        subtitle="기록을 다시 다듬어보세요"
      />

      <div className="flex-1 min-h-0 overflow-y-auto md:flex md:overflow-hidden">
        <PhotoPanel
          active={spot.active}
          photoError={spotPhotoError}
          photosState={{
            selectedPhotoIdx: photo.selectedPhotoIdx,
            isUploadingPhoto: photo.isUploadingPhoto,
            uploadProgress: photo.uploadProgress,
            onPhotoAdd: photo.handlePhotoAdd,
            onRemovePhoto: photo.removePhoto,
            onSelectPhoto: photo.setSelectedPhotoIdx,
            onReorderPhotos: photo.reorderPhotos,
          }}
        />

        <div className="px-4 pb-6 flex flex-col gap-5 md:flex-1 md:overflow-y-auto md:px-7 md:py-4 md:pb-4 md:gap-4">
          <TitleSection title={title} setTitle={setTitle} error={titleError} />
          <DescriptionSection
            description={description}
            setDescription={setDescription}
            error={descriptionError}
          />

          <div>
            <FieldLabel>썸네일</FieldLabel>
            <ThumbnailPicker
              spots={spot.spots}
              thumbnailKey={photo.thumbnailKey}
              onSelect={photo.setThumbnailKey}
            />
          </div>

          <div>
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
            <Button variant="secondary" size="md" onClick={() => setConfirmRemoveSpotId(null)}>
              취소
            </Button>
            <Button
              variant="outline"
              size="md"
              className="text-error border-error hover:bg-error/5"
              onClick={handleConfirmRemoveSpot}
            >
              삭제
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-text-body">이 위치를 삭제할까요? 입력한 내용이 모두 사라집니다.</p>
      </Modal>

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
          disabled={isEditing}
          loading={isEditing}
        >
          수정하기
        </Button>
      </div>
    </div>
  )
}
