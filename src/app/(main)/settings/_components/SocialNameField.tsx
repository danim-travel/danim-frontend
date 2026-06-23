"use client"
import { useSyncExternalStore, useState } from "react"
import { Button, Modal, TextField } from "@/components/common"
import type { MeDetailResponse } from "@/types"

interface SocialNameFieldProps {
  me: MeDetailResponse
  name: string
  isNameValid: boolean
  nameError?: string
  onNameChange: (v: string) => void
  /** true = 저장 성공, false = 실패(에러 토스트는 부모에서 처리) */
  onSave: () => Promise<boolean>
}

function storageKey(userId: string) {
  return `danim_social_name_saved_${userId}`
}

export function SocialNameField({ me, name, isNameValid, nameError, onNameChange, onSave }: SocialNameFieldProps) {
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
    return (
      <div className="flex flex-col gap-2 min-w-0">
        <span className="text-caption font-bold text-text-muted">이름</span>
        <span className="text-body-sm text-text break-all">{me.name || name}</span>
      </div>
    )
  }

  return (
    <>
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <TextField
            label="이름"
            required
            type="text"
            placeholder="실명을 입력해주세요"
            value={name}
            onChange={e => onNameChange(e.target.value)}
            error={nameError}
            autoComplete="name"
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="shrink-0 mb-px"
          disabled={!isNameValid || isSaving}
          onClick={() => setModalOpen(true)}
        >
          저장
        </Button>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="이름 저장"
        className="max-w-sm"
        footer={
          <>
            <Button variant="outline" disabled={isSaving} onClick={() => setModalOpen(false)}>취소</Button>
            <Button variant="primary" loading={isSaving} disabled={isSaving} onClick={() => { void handleConfirm() }}>확인</Button>
          </>
        }
        footerAlign="stretch"
      >
        <p className="text-body-sm text-text">이름은 다시 변경할 수 없습니다.</p>
      </Modal>
    </>
  )
}
