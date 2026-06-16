"use client"
import { useState, useRef, useEffect } from "react"
import { Avatar, Button, TextField } from "@/components/common"
import { getApiErrorMessage } from "@/lib/apiError"
import { uploadImage } from "@/lib/uploadImage"
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
      <div className="bg-bg-card border border-border rounded-card shadow-sm p-8 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              src={displayImg ?? undefined}
              initial={me.nickname[0]}
              size="xl"
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-body-sm font-bold text-text">프로필 사진</span>
              <span className="text-caption text-text-muted">JPG, PNG 파일 · 최대 5MB · 정사각형 권장</span>
            </div>
          </div>
          <div className="flex gap-2">
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
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isUploading}
              onClick={handleDelete}
            >
              삭제
            </Button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        <TextField
          value={intro}
          onChange={e => onIntroChange(e.target.value)}
          placeholder="소개"
          maxLength={100}
        />
      </div>
    </section>
  )
}
