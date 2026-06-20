"use client"
import { useState } from "react"
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
  onSave: () => Promise<void>
}

const BIRTH_INPUT_CLASS = "h-12 text-center px-2"

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

  const locked = (me.birth_day ?? "") !== "" || savedThisSession

  async function handleConfirm() {
    setIsSaving(true)
    try {
      await onSave()
      setSavedThisSession(true)
      setModalOpen(false)
    } catch {
      // 에러 토스트는 부모(page.tsx)에서 처리
    } finally {
      setIsSaving(false)
    }
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
                disabled={locked}
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
                disabled={locked}
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
                disabled={locked}
              />
            </div>
          </div>
          {!locked && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="shrink-0"
              disabled={!isBirthValid || isSaving}
              onClick={() => setModalOpen(true)}
            >
              수정
            </Button>
          )}
        </div>
        {!locked && birthError && (
          <span className="block mt-2 text-caption text-error">{birthError}</span>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="생년월일 수정"
        className="max-w-sm"
        footer={
          <>
            <Button variant="outline" disabled={isSaving} onClick={() => setModalOpen(false)}>취소</Button>
            <Button variant="primary" loading={isSaving} disabled={isSaving} onClick={() => { void handleConfirm() }}>확인</Button>
          </>
        }
        footerAlign="stretch"
      >
        <p className="text-body-sm text-text">생년월일은 저장 후 다시 수정할 수 없습니다.</p>
      </Modal>
    </>
  )
}
