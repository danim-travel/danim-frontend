"use client"
import { useState } from "react"
import { Button, Modal, TextField } from "@/components/common"
import type { MeDetailResponse } from "@/types"

interface SocialNameFieldProps {
  me: MeDetailResponse
  name: string
  isNameValid: boolean
  nameError?: string
  onNameChange: (v: string) => void
  onSave: () => Promise<void>
}

export function SocialNameField({ me, name, isNameValid, nameError, onNameChange, onSave }: SocialNameFieldProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedThisSession, setSavedThisSession] = useState(false)

  const locked = (me.name ?? "") !== "" || savedThisSession

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
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <TextField
            label="이름"
            required
            type="text"
            placeholder="실명을 입력해주세요"
            value={locked ? (me.name ?? "") : name}
            onChange={e => onNameChange(e.target.value)}
            error={locked ? undefined : nameError}
            autoComplete="name"
            disabled={locked}
          />
        </div>
        {!locked && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="shrink-0 mb-px"
            disabled={!isNameValid || isSaving}
            onClick={() => setModalOpen(true)}
          >
            수정
          </Button>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="이름 수정"
        className="max-w-sm"
        footer={
          <>
            <Button variant="outline" disabled={isSaving} onClick={() => setModalOpen(false)}>취소</Button>
            <Button variant="primary" loading={isSaving} disabled={isSaving} onClick={() => { void handleConfirm() }}>확인</Button>
          </>
        }
        footerAlign="stretch"
      >
        <p className="text-body-sm text-text">이름은 저장 후 다시 수정할 수 없습니다.</p>
      </Modal>
    </>
  )
}
