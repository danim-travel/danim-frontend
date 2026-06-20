"use client"
import { VerificationField } from "@/components/common"
import type { MeDetailResponse } from "@/types"

interface BasicInfoSectionProps {
  me: MeDetailResponse
  nickname: string
  nicknameChecked: boolean
  isCheckingNickname: boolean
  onNicknameChange: (v: string) => void
  onNicknameCheck: () => void
}

function formatBirthDate(date: string | null) {
  if (!date) return "-"
  const [y, m, d] = date.split("-")
  return `${y}년  ${m}월  ${d}일`
}

export function BasicInfoSection({ me, nickname, nicknameChecked, isCheckingNickname, onNicknameChange, onNicknameCheck }: BasicInfoSectionProps) {
  return (
    <section>
      <h2 className="text-body-lg font-bold text-text mb-4">기본 정보</h2>
      <div className="bg-bg-card border border-border rounded-card shadow-sm p-5 md:p-8 flex flex-col gap-7">
        {/* 이름·이메일·생년월일 읽기 전용 */}
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
        <VerificationField
          label="닉네임"
          required
          value={nickname}
          onChange={e => onNicknameChange(e.target.value)}
          maxLength={20}
          actionLabel="중복확인"
          onAction={onNicknameCheck}
          actionDisabled={!nickname.trim() || isCheckingNickname}
          actionLoading={isCheckingNickname}
          helperText={nicknameChecked ? "사용 가능한 닉네임입니다." : "다른 사용자에게 보이는 이름이에요."}
          helperTone={nicknameChecked ? "primary" : "muted"}
        />
      </div>
    </section>
  )
}
