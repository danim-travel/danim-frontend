'use client'

import { useState, useRef, useEffect } from 'react'
import { uploadImage } from '@/lib/uploadImage'
import { getApiErrorMessage } from '@/lib/apiError'
import { toast } from '@/store/toastStore'
import type { CreatePostSpotImage } from '@/types'
import { MAX_PHOTOS } from '../_constants'
import type { SpotFormData } from '../_types/write.types'
import { findFallbackThumbnail } from '../_helpers/thumbnail.helper'

type UsePhotoManagerArgs = {
  spots: SpotFormData[]
  active: SpotFormData
  updateSpot: (id: string, updates: Partial<SpotFormData>) => void
}

export function usePhotoManager({ spots, active, updateSpot }: UsePhotoManagerArgs) {
  // 현재 선택된 썸네일 이미지의 S3 key
  const [thumbnailKey, setThumbnailKey] = useState<string | null>(null)
  // 현재 선택된 사진의 인덱스
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0)
  // 사진 업로드 중 여부
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  // 업로드 진행률 — 다중 사진 동시 업로드 시 "N / M" 표시용
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 })
  // 언마운트 후 setState/updateSpot 호출 방지
  const aliveRef = useRef(true)

  // handlePhotoAdd는 async 함수라 클로저로 캡처된 spots가 업로드 완료 시점에 낡은 값일 수 있음 — ref로 항상 최신값 참조
  const spotsRef = useRef(spots)

  useEffect(() => {
    spotsRef.current = spots
  }, [spots])

  useEffect(() => {
    return () => {
      aliveRef.current = false
      spotsRef.current.forEach((s) => s.previewUrls.forEach((url) => URL.revokeObjectURL(url)))
    }
  }, []) // 언마운트 시 1회만 실행

  /* Photo upload (presigned URL → S3 PUT) — 첫 사진 업로드 시 썸네일 자동 지정 */
  const handlePhotoAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const current = active.images
    const remaining = MAX_PHOTOS - current.length
    if (remaining <= 0) {
      e.target.value = ''
      return
    }
    const targetFiles = files.slice(0, remaining)
    const targetSpotId = active.id

    // 업로드 전에 blob URL 먼저 생성 — 실패 시 catch에서 revoke 가능하도록 추적
    const pairs = targetFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }))

    setIsUploadingPhoto(true)
    setUploadProgress({ current: 0, total: pairs.length })
    try {
      const uploaded = await Promise.all(
        pairs.map(async ({ file, previewUrl }) => {
          const { img_url, key } = await uploadImage('posts/presigned-url', file)
          setUploadProgress((prev) => ({ ...prev, current: prev.current + 1 }))
          const image: CreatePostSpotImage = { original_img: img_url, key }
          return { image, previewUrl }
        })
      )

      // 업로드는 async라 완료될 때쯤엔 사용자가 다른 spot으로 탭을 전환했을 수 있음 -> 의도한 spot에서만 작동
      const targetSpot = spotsRef.current.find((s) => s.id === targetSpotId)
      if (targetSpot) {
        updateSpot(targetSpotId, {
          images: [...targetSpot.images, ...uploaded.map((u) => u.image)],
          previewUrls: [...targetSpot.previewUrls, ...uploaded.map((u) => u.previewUrl)],
        })
      }

      // 첫 번째 사진 업로드 시 썸네일 자동 지정
      if (!thumbnailKey && uploaded.length > 0) {
        setThumbnailKey(uploaded[0].image.key)
      }
    } catch (err) {
      // 업로드 실패 시 미리 생성한 blob URL 전부 revoke
      pairs.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl))
      console.error('사진 업로드 실패:', err)
      toast.error(getApiErrorMessage(err, { client: '사진 업로드에 실패했습니다.' }))
    } finally {
      e.target.value = ''
      setIsUploadingPhoto(false)
      setUploadProgress({ current: 0, total: 0 })
    }
  }

  const removePhoto = (photoIdx: number) => {
    const removed = active.images[photoIdx] // 삭제될 이미지 정보
    const nextImages = active.images.filter((_, i) => i !== photoIdx)
    const nextPreviews = active.previewUrls.filter((_, i) => i !== photoIdx) // images와 동일 인덱스로 동기화 제거
    if (active.previewUrls[photoIdx]) URL.revokeObjectURL(active.previewUrls[photoIdx]) // blob URL 메모리 해제
    updateSpot(active.id, { images: nextImages, previewUrls: nextPreviews })
    setSelectedPhotoIdx((prev) => Math.max(0, Math.min(prev, nextImages.length - 1))) // 삭제 후 인덱스 범위 초과 방지

    // 삭제한 사진이 썸네일이었으면 다른 사진으로 대체
    if (removed && thumbnailKey === removed.key) {
      setThumbnailKey(findFallbackThumbnail(spots, active.id, nextImages))
    }
  }

  const reorderPhotos = (srcIdx: number, targetIdx: number) => {
    const nextImages = [...active.images]
    const nextPreviews = [...active.previewUrls]
    const [movedImg] = nextImages.splice(srcIdx, 1)
    const [movedPrev] = nextPreviews.splice(srcIdx, 1)
    nextImages.splice(targetIdx, 0, movedImg)
    nextPreviews.splice(targetIdx, 0, movedPrev)
    updateSpot(active.id, { images: nextImages, previewUrls: nextPreviews })
    setSelectedPhotoIdx(targetIdx)
  }

  return {
    thumbnailKey,
    setThumbnailKey,
    selectedPhotoIdx,
    setSelectedPhotoIdx,
    isUploadingPhoto,
    uploadProgress,
    handlePhotoAdd,
    removePhoto,
    reorderPhotos,
  }
}
