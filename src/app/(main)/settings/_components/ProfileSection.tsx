"use client"
import { useRef } from "react"
import { Avatar, Button, TextField } from "@/components/common"
import type { MeDetailResponse } from "@/types"

interface ProfileSectionProps {
  me: MeDetailResponse
  intro: string
  profileImg: string | null
  onIntroChange: (v: string) => void
  onProfileImgChange: (url: string | null) => void
}

export function ProfileSection({
  me,
  intro,
  profileImg,
  onIntroChange,
  onProfileImgChange,
}: ProfileSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onProfileImgChange(URL.createObjectURL(file))
  }

  function handleDelete() {
    onProfileImgChange(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <section>
      <h2 className="text-body-lg font-bold text-text mb-4">내 프로필</h2>
      <div className="bg-bg-card border border-border rounded-card shadow-sm p-8 flex flex-col gap-5">
        {/* 프로필 사진 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              src={profileImg ?? undefined}
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
              onClick={() => fileInputRef.current?.click()}
            >
              사진 변경
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleDelete}
            >
              삭제
            </Button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        {/* 소개 */}
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
