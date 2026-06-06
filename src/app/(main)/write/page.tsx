'use client'

import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { PenLine } from 'lucide-react'
import { Button } from '@/components/common'
import { FieldLabel } from '@/components/common'
import { TextField } from '@/components/common'
import { useWriteForm } from './_hooks/useWriteForm'
import PhotoPanel from './_components/PhotoPanel'
import SpotOrderList from './_components/SpotOrderList'
import SpotIndicatorBar from './_components/SpotIndicatorBar'
import ThumbnailPicker from './_components/ThumbnailPicker'
import { MAX_SPOTS } from './_constants'

// KakaoMap SDK는 window 객체에 의존하므로 SSR에서 실행하면 터짐 — 브라우저 전용으로 지연 로드
const LocationSearch = dynamic(() => import('./_components/LocationSearch'), {
  ssr: false,
})

export default function WritePage() {
  const router = useRouter()
  const { title, setTitle, spot, photo, submit } = useWriteForm()

  const handleSubmit = async () => {
    const ok = await submit.submitPost()
    if (ok) router.push('/')
  }

  const handleCancel = () => router.back()

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-7 py-4 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <PenLine className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-base font-bold text-text">여행 기록하기</h1>
            <p className="text-nav text-text-disabled mt-0.5">당신의 소중한 순간을 기록해보세요</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleCancel}>
          취소
        </Button>
      </div>

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
            {/* 제목 */}
            <div>
              <TextField
                label="제목"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="여행의 제목을 입력하세요"
                maxLength={50}
                rightSlot={
                  <span className="text-nav text-text-disabled">{title.length}/50</span>
                }
              />
            </div>

            {/* 본문 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <FieldLabel>본문</FieldLabel>
                <span className="text-nav text-text-placeholder">{spot.activeIdx + 1}번 위치</span>
              </div>
              <div className="relative">
                {/* key로 spot 전환 시 textarea를 강제 리마운트 — 이전 spot 입력값이 남는 DOM 상태 초기화 */}
              <textarea
                  key={spot.active.id}
                  value={spot.active.content}
                  onChange={(e) => spot.updateSpot(spot.active.id, { content: e.target.value })}
                  placeholder="이 장소에서의 이야기를 들려주세요..."
                  maxLength={500}
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-border text-body-sm outline-none focus:border-primary transition-colors resize-none bg-white"
                />
                <span className="absolute bottom-3 right-4 text-nav text-text-disabled">
                  {spot.active.content.length}/500
                </span>
              </div>
            </div>

            {/* 위치 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <FieldLabel>위치 / 장소</FieldLabel>
                <span className="text-nav text-text-placeholder">{spot.activeIdx + 1}번 위치</span>
              </div>
              {/* key로 spot 전환 시 검색 입력·결과 상태 초기화 */}
              <LocationSearch
                key={spot.active.id}
                value={spot.active.location ? [spot.active.location] : []}
                onChange={(places) => spot.updateSpot(spot.active.id, { location: places[0] ?? null })}
                singleMode
              />
            </div>

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
          disabled={!submit.canSubmit}
          loading={submit.isSubmitting}
        >
          게시하기
        </Button>
      </div>
    </div>
  )
}
