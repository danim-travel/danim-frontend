"use client"
import { useSyncExternalStore, useState } from "react"
import { Button, FieldLabel, Modal, TextField } from "@/components/common"
import type { MeDetailResponse } from "@/types"

interface SocialBirthDayFieldProps {
  me: MeDetailResponse
  birthYear: string
  birthMonth: string
  birthDay: string
  isBirthValid: boolean
  birthError?: string
  onBirthYearChange: (v: string) => void
  onBirthMonthChange: (v: string) => void
  onBirthDayChange: (v: string) => void
  /** true = 저장 성공, false = 실패(에러 토스트는 부모에서 처리) */
  onSave: () => Promise<boolean>
}

const BIRTH_INPUT_CLASS = "h-12 text-center px-2"

function storageKey(userId: string) {
  return `danim_social_birth_day_saved_${userId}`
}

function formatBirthDate(date: string | null | undefined): string {
  if (!date) return "-"
  const [y, m, d] = date.split("-")
  if (!y || !m || !d) return "-"
  return `${y}년  ${m}월  ${d}일`
}

export function SocialBirthDayField({
  me,
  birthYear,
  birthMonth,
  birthDay,
  isBirthValid,
  birthError,
  onBirthYearChange,
  onBirthMonthChange,
  onBirthDayChange,
  onSave,
}: SocialBirthDayFieldProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedThisSession, setSavedThisSession] = useState(false)

  // localStorage를 외부 스토어로 읽음 — SSR은 false, 클라이언트는 실제 플래그 반환
  const savedPreviously = useSyncExternalStore(
    (cb) => { window.addEventListener('storage', cb); return () => window.removeEventListener('storage', cb) },
    () => localStorage.getItem(storageKey(me.user_id)) === '1',
    () => false,
  )

  // 값 존재 여부가 아닌 "1회 저장 여부"만으로 잠금 판단
  const locked = savedPreviously || savedThisSession

  async function handleConfirm() {
    setIsSaving(true)
    try {
      const ok = await onSave()
      if (ok) {
        localStorage.setItem(storageKey(me.user_id), '1')
        setSavedThisSession(true)
        setModalOpen(false)
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (locked) {
    // 로컬 입력값을 우선 사용 — 저장 직후 me.birth_day가 stale(2001-01-01)이면 덮어쓰는 문제 방지
    const displayDate =
      (birthYear && birthMonth && birthDay
        ? `${birthYear}-${birthMonth.padStart(2, "0")}-${birthDay.padStart(2, "0")}`
        : "") ||
      me.birth_day
    return (
      <div className="flex flex-col gap-2 min-w-0">
        <span className="text-caption font-bold text-text-muted">생년월일</span>
        <span className="text-body-sm text-text">{formatBirthDate(displayDate)}</span>
      </div>
    )
  }

  return (
    <>
      <div>
        <FieldLabel htmlFor="settings-birthdate-year" required>생년월일</FieldLabel>
        <div className="flex gap-2 items-center mt-1.5">
          <div className="flex gap-2 flex-1">
            <div className="flex-[1.2]">
              <TextField
                id="settings-birthdate-year"
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="YYYY"
                aria-label="출생 연도"
                className={BIRTH_INPUT_CLASS}
                autoComplete="bday-year"
                value={birthYear}
                onChange={e => onBirthYearChange(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="flex-1">
              <TextField
                type="text"
                inputMode="numeric"
                maxLength={2}
                placeholder="MM"
                aria-label="출생 월"
                className={BIRTH_INPUT_CLASS}
                autoComplete="bday-month"
                value={birthMonth}
                onChange={e => onBirthMonthChange(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="flex-1">
              <TextField
                type="text"
                inputMode="numeric"
                maxLength={2}
                placeholder="DD"
                aria-label="출생 일"
                className={BIRTH_INPUT_CLASS}
                autoComplete="bday-day"
                value={birthDay}
                onChange={e => onBirthDayChange(e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="shrink-0"
            disabled={!isBirthValid || isSaving}
            onClick={() => setModalOpen(true)}
          >
            저장
          </Button>
        </div>
        {birthError && (
          <span className="block mt-2 text-caption text-error">{birthError}</span>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="생년월일 저장"
        className="max-w-sm"
        footer={
          <>
            <Button variant="outline" disabled={isSaving} onClick={() => setModalOpen(false)}>취소</Button>
            <Button variant="primary" loading={isSaving} disabled={isSaving} onClick={() => { void handleConfirm() }}>확인</Button>
          </>
        }
        footerAlign="stretch"
      >
        <p className="text-body-sm text-text">생년월일은 다시 변경할 수 없습니다.</p>
      </Modal>
    </>
  )
}
