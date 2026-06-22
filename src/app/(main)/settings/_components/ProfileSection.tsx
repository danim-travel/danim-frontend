"use client"
import { useState, useRef, useEffect } from "react"
import { Camera, Trash2 } from "lucide-react"
import { Avatar, Button, Modal, TextField } from "@/components/common"
import { getApiErrorMessage } from "@/lib/apiError"
import { uploadImage } from "@/lib/media/uploadImage"
import { toast } from "@/store/toastStore"
import type { MeDetailResponse } from "@/types"

interface ProfileSectionProps {
  me: MeDetailResponse
  intro: string
  profileImg: string | null
  onIntroChange: (v: string) => void
  onProfileImgChange: (url: string | null) => void
  onProfileKeyChange: (key: string | null | undefined) => void
}

export function ProfileSection({
  me,
  intro,
  profileImg,
  onIntroChange,
  onProfileImgChange,
  onProfileKeyChange,
}: ProfileSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // previewUrl이 교체되거나 컴포넌트 언마운트 시 blob URL을 해제한다
  useEffect(() => {
    if (!previewUrl) return
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setPreviewUrl(URL.createObjectURL(file))
    setIsUploading(true)

    try {
      const { presigned_url, key } = await uploadImage('users/me/profile-image/presigned-url', file)
      onProfileImgChange(presigned_url)
      onProfileKeyChange(key)
    } catch (err) {
      toast.error(getApiErrorMessage(err, { client: '이미지 업로드에 실패했습니다.' }))
      if (fileInputRef.current) fileInputRef.current.value = ""
      setPreviewUrl(null)
      onProfileKeyChange(undefined)
    } finally {
      setIsUploading(false)
    }
  }

  function handleDelete() {
    setPreviewUrl(null)
    onProfileImgChange(null)
    onProfileKeyChange(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const displayImg = previewUrl ?? profileImg

  return (
    <section>
      <h2 className="text-body-lg font-bold text-text mb-4">내 프로필</h2>
      <div className="bg-bg-card border border-border rounded-card shadow-sm p-5 md:p-8 flex flex-col gap-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative shrink-0">
              <Avatar
                src={displayImg ?? undefined}
                initial={me.nickname[0]}
                size="xl"
                className="w-20 h-20 md:w-28 md:h-28"
              />
              {/* 모바일 오버레이 아이콘 */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                aria-label="사진 변경"
                className="md:hidden absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow disabled:opacity-50"
              >
                <Camera size={14} className="text-text-inverse" />
              </button>
              {!!displayImg && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isUploading}
                  aria-label="사진 삭제"
                  className="md:hidden absolute bottom-0 left-0 w-7 h-7 bg-error rounded-full flex items-center justify-center shadow disabled:opacity-50"
                >
                  <Trash2 size={14} className="text-text-inverse" />
                </button>
              )}
            </div>
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <span className="text-body-sm font-bold text-text">프로필 사진</span>
              <span className="text-caption text-text-muted break-keep">JPG, PNG 파일 · 정사각형 권장</span>
            </div>
          </div>
          <div className="hidden md:flex gap-2 shrink-0">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={isUploading}
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              사진 변경
            </Button>
            {!!displayImg && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isUploading}
                onClick={() => setShowDeleteConfirm(true)}
              >
                삭제
              </Button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        <TextField
          label="소개글"
          name="intro"
          value={intro}
          onChange={e => onIntroChange(e.target.value)}
          placeholder="소개를 입력해주세요"
          maxLength={100}
        />
      </div>

      <Modal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="프로필 사진 삭제"
        className="max-w-sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>취소</Button>
            <Button variant="primary" onClick={() => { handleDelete(); setShowDeleteConfirm(false) }}>삭제</Button>
          </>
        }
        footerAlign="stretch"
      >
        <p className="text-body-sm text-text">프로필 사진을 삭제하시겠습니까?</p>
      </Modal>
    </section>
  )
}
