'use client'

import { useState, useCallback } from 'react'
import { useSpotManager } from './useSpotManager'
import { usePhotoManager } from './usePhotoManager'
import { usePostSubmit } from './usePostSubmit'

export type { SpotFormData } from '../_types/write.types'

export function useWriteForm() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  // 스팟 목록 CRUD + 활성 스팟 관리
  const spot = useSpotManager()
  // 스팟별 사진 업로드·순서 변경·썸네일 관리
  const photo = usePhotoManager({
    spots: spot.spots,
    active: spot.active,
    updateSpot: spot.updateSpot,
  })
  // 게시글 제출 가능 여부 판단 + API 호출
  const submit = usePostSubmit({
    title,
    description,
    spots: spot.spots,
    thumbnailKey: photo.thumbnailKey,
  })

  // spot 전환/삭제 시 선택 사진 인덱스 초기화 — 두 훅에 걸친 관심사이므로 Facade에서 처리
  const { selectSpot: baseSelectSpot, removeSpot: baseRemoveSpot } = spot
  const { setSelectedPhotoIdx, setThumbnailKey, thumbnailKey } = photo
  const selectSpot = useCallback((id: string) => {
    baseSelectSpot(id)
    setSelectedPhotoIdx(0)
  }, [baseSelectSpot, setSelectedPhotoIdx])
  const removeSpot = useCallback((id: string) => {
    const removedSpot = spot.spots.find(s => s.id === id)
    baseRemoveSpot(id)
    setSelectedPhotoIdx(0)
    // 삭제한 스팟의 이미지가 썸네일이었으면 남은 이미지 중 첫 번째로 대체
    if (removedSpot?.images.some(img => img.key === thumbnailKey)) {
      const remaining = spot.spots.filter(s => s.id !== id).flatMap(s => s.images)
      setThumbnailKey(remaining[0]?.key ?? null)
    }
  }, [baseRemoveSpot, setSelectedPhotoIdx, spot.spots, thumbnailKey, setThumbnailKey])

  return {
    title,
    setTitle,
    description,
    setDescription,
    spot: {
      spots: spot.spots,
      activeId: spot.activeId,
      activeIdx: spot.activeIdx,
      active: spot.active,
      selectSpot,
      addSpot: spot.addSpot,
      removeSpot,
      updateSpot: spot.updateSpot,
      reorderSpots: spot.reorderSpots,
    },
    photo: {
      thumbnailKey: photo.thumbnailKey,
      setThumbnailKey: photo.setThumbnailKey,
      selectedPhotoIdx: photo.selectedPhotoIdx,
      setSelectedPhotoIdx: photo.setSelectedPhotoIdx,
      isUploadingPhoto: photo.isUploadingPhoto,
      uploadProgress: photo.uploadProgress,
      handlePhotoAdd: photo.handlePhotoAdd,
      removePhoto: photo.removePhoto,
      reorderPhotos: photo.reorderPhotos,
    },
    submit: {
      isSubmitting: submit.isSubmitting,
      canSubmit: submit.canSubmit,
      submitPost: submit.submitPost,
    },
  }
}
