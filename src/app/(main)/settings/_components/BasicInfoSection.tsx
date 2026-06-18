"use client"
import { Button, TextField } from "@/components/common"
import type { MeDetailResponse } from "@/types"

interface BasicInfoSectionProps {
  me: MeDetailResponse
  nickname: string
  nicknameError?: string
  onNicknameChange: (v: string) => void
  onNicknameBlur?: () => void
}

function formatBirthDate(date: string | null) {
  if (!date) return "-"
  const [y, m, d] = date.split("-")
  return `${y}년  ${m}월  ${d}일`
}

export function BasicInfoSection({ me, nickname, nicknameError, onNicknameChange, onNicknameBlur }: BasicInfoSectionProps) {
  return (
    <section>
      <h2 className="text-body-lg font-bold text-text mb-4">기본 정보</h2>
      <div className="bg-bg-card border border-border rounded-card shadow-sm p-5 md:p-8 flex flex-col gap-7">
        {/* 읽기 전용 정보 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-16">
          <div className="flex flex-col gap-2 min-w-0">
            <span className="text-caption font-bold text-text-muted">이름</span>
            <span className="text-body-sm text-text break-all">{me.name}</span>
          </div>
          <div className="flex flex-col gap-2 min-w-0">
            <span className="text-caption font-bold text-text-muted">이메일</span>
            <span className="text-body-sm text-text break-all">{me.email}</span>
          </div>
          <div className="flex flex-col gap-2 min-w-0">
            <span className="text-caption font-bold text-text-muted">생년월일</span>
            <span className="text-body-sm text-text break-all">{formatBirthDate(me.birth_day)}</span>
          </div>
        </div>

        {/* 닉네임 */}
        <TextField
          label="닉네임"
          required
          value={nickname}
          onChange={e => onNicknameChange(e.target.value)}
          onBlur={onNicknameBlur}
          error={nicknameError}
          maxLength={20}
          helperText={nicknameError ? undefined : "다른 사용자에게 보이는 이름이에요."}
        />

        {/* 휴대폰 인증 — 준비 중 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <label className="text-caption font-bold text-text-muted">휴대폰 인증</label>
            <span className="text-caption text-text-muted bg-bg-muted px-1.5 py-0.5 rounded">준비 중</span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <TextField
                type="tel"
                placeholder="010-0000-0000"
                disabled
              />
            </div>
            <Button type="button" variant="primary" disabled>
              인증 요청
            </Button>
          </div>
          <p className="text-caption text-text-muted">안전한 계정 보호를 위해 인증해주세요.</p>
        </div>
      </div>
    </section>
  )
}
