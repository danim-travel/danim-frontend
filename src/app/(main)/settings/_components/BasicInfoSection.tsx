"use client"
import { useState } from "react"
import { Button, FieldLabel, Modal, TextField, VerificationField } from "@/components/common"
import type { MeDetailResponse } from "@/types"

interface BasicInfoSectionProps {
  me: MeDetailResponse
  nickname: string
  nicknameChecked: boolean
  isCheckingNickname: boolean
  onNicknameChange: (v: string) => void
  onNicknameCheck: () => void
  // 소셜 로그인 사용자 전용
  isSocial?: boolean
  name?: string
  birthYear?: string
  birthMonth?: string
  birthDay?: string
  isNameValid?: boolean
  isBirthValid?: boolean
  onNameChange?: (v: string) => void
  onBirthYearChange?: (v: string) => void
  onBirthMonthChange?: (v: string) => void
  onBirthDayChange?: (v: string) => void
  nameError?: string
  birthError?: string
  onSaveName?: () => Promise<void>
  onSaveBirthDay?: () => Promise<void>
}

function formatBirthDate(date: string | null) {
  if (!date) return "-"
  const [y, m, d] = date.split("-")
  return `${y}년  ${m}월  ${d}일`
}

const BIRTH_INPUT_CLASS = "h-12 text-center px-2"

export function BasicInfoSection({
  me,
  nickname,
  nicknameChecked,
  isCheckingNickname,
  onNicknameChange,
  onNicknameCheck,
  isSocial = false,
  name = "",
  birthYear = "",
  birthMonth = "",
  birthDay = "",
  isNameValid = false,
  isBirthValid = false,
  onNameChange,
  onBirthYearChange,
  onBirthMonthChange,
  onBirthDayChange,
  nameError,
  birthError,
  onSaveName,
  onSaveBirthDay,
}: BasicInfoSectionProps) {
  const [nameModalOpen, setNameModalOpen] = useState(false)
  const [birthModalOpen, setBirthModalOpen] = useState(false)
  const [isSavingName, setIsSavingName] = useState(false)
  const [isSavingBirth, setIsSavingBirth] = useState(false)
  // 이번 세션에서 저장 성공 여부 — 서버가 빈 문자열을 반환해도 1회성 불변식 유지
  const [nameSavedThisSession, setNameSavedThisSession] = useState(false)
  const [birthSavedThisSession, setBirthSavedThisSession] = useState(false)

  // me.name / me.birth_day 값이 있거나 이번 세션에서 저장한 경우 수정 불가
  const nameLocked = (me.name ?? "") !== "" || nameSavedThisSession
  const birthLocked = (me.birth_day ?? "") !== "" || birthSavedThisSession

  async function handleConfirmSaveName() {
    setIsSavingName(true)
    try {
      await onSaveName?.()
      setNameSavedThisSession(true)
      setNameModalOpen(false)
    } catch {
      // 에러 토스트는 부모(page.tsx)에서 처리
    } finally {
      setIsSavingName(false)
    }
  }

  async function handleConfirmSaveBirthDay() {
    setIsSavingBirth(true)
    try {
      await onSaveBirthDay?.()
      setBirthSavedThisSession(true)
      setBirthModalOpen(false)
    } catch {
      // 에러 토스트는 부모(page.tsx)에서 처리
    } finally {
      setIsSavingBirth(false)
    }
  }

  return (
    <section>
      <h2 className="text-body-lg font-bold text-text mb-4">기본 정보</h2>
      <div className="bg-bg-card border border-border rounded-card shadow-sm p-5 md:p-8 flex flex-col gap-7">
        {isSocial ? (
          /* 소셜 로그인: 이름·생년월일 최초 1회 수정 가능 */
          <div className="flex flex-col gap-5">
            {/* 이름 */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <TextField
                  label="이름"
                  required
                  type="text"
                  placeholder="실명을 입력해주세요"
                  value={nameLocked ? (me.name ?? "") : name}
                  onChange={e => onNameChange?.(e.target.value)}
                  error={nameLocked ? undefined : nameError}
                  autoComplete="name"
                  disabled={nameLocked}
                />
              </div>
              {!nameLocked && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="shrink-0 mb-px"
                  disabled={!isNameValid || isSavingName}
                  onClick={() => setNameModalOpen(true)}
                >
                  수정
                </Button>
              )}
            </div>

            {/* 생년월일 */}
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
                      onChange={e => onBirthYearChange?.(e.target.value.replace(/\D/g, ""))}
                      disabled={birthLocked}
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
                      onChange={e => onBirthMonthChange?.(e.target.value.replace(/\D/g, ""))}
                      disabled={birthLocked}
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
                      onChange={e => onBirthDayChange?.(e.target.value.replace(/\D/g, ""))}
                      disabled={birthLocked}
                    />
                  </div>
                </div>
                {!birthLocked && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="shrink-0"
                    disabled={!isBirthValid || isSavingBirth}
                    onClick={() => setBirthModalOpen(true)}
                  >
                    수정
                  </Button>
                )}
              </div>
              {!birthLocked && birthError && (
                <span className="block mt-2 text-caption text-error">{birthError}</span>
              )}
            </div>
          </div>
        ) : (
          /* 이메일 로그인: 이름·이메일·생년월일 읽기 전용 */
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
        )}

        {/* 소셜 로그인일 때 이메일 별도 행 읽기 전용 */}
        {isSocial && (
          <div className="flex flex-col gap-2 min-w-0">
            <span className="text-caption font-bold text-text-muted">이메일</span>
            <span className="text-body-sm text-text break-all">{me.email}</span>
          </div>
        )}

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

      {/* 이름 수정 확인 모달 */}
      {isSocial && (
        <Modal
          open={nameModalOpen}
          onClose={() => setNameModalOpen(false)}
          title="이름 수정"
          className="max-w-sm"
          footer={
            <>
              <Button variant="outline" disabled={isSavingName} onClick={() => setNameModalOpen(false)}>취소</Button>
              <Button variant="primary" loading={isSavingName} disabled={isSavingName} onClick={() => { void handleConfirmSaveName() }}>확인</Button>
            </>
          }
          footerAlign="stretch"
        >
          <p className="text-body-sm text-text">이름은 저장 후 다시 수정할 수 없습니다.</p>
        </Modal>
      )}

      {/* 생년월일 수정 확인 모달 */}
      {isSocial && (
        <Modal
          open={birthModalOpen}
          onClose={() => setBirthModalOpen(false)}
          title="생년월일 수정"
          className="max-w-sm"
          footer={
            <>
              <Button variant="outline" disabled={isSavingBirth} onClick={() => setBirthModalOpen(false)}>취소</Button>
              <Button variant="primary" loading={isSavingBirth} disabled={isSavingBirth} onClick={() => { void handleConfirmSaveBirthDay() }}>확인</Button>
            </>
          }
          footerAlign="stretch"
        >
          <p className="text-body-sm text-text">생년월일은 저장 후 다시 수정할 수 없습니다.</p>
        </Modal>
      )}
    </section>
  )
}
