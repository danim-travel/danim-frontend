"use client"
import { useState } from "react"
import { PasswordChangeModal } from "./PasswordChangeModal"
import { DeleteAccountModal } from "./DeleteAccountModal"
import { SettingsRow } from "@/components/common"

export function AccountSection() {
  const [passwordModal, setPasswordModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)

  return (
    <section>
      <h2 className="text-body-lg font-bold text-text mb-4">계정 &amp; 보안</h2>
      <div className="bg-bg-card border border-border rounded-card shadow-surface p-6 flex flex-col gap-3">
        <SettingsRow
          title="비밀번호 변경"
          description="비밀번호를 변경합니다."
          onClick={() => setPasswordModal(true)}
        />
        <button
          type="button"
          onClick={() => setDeleteModal(true)}
          className="self-center text-body-sm font-bold text-(--color-error) hover:opacity-70 transition-opacity w-fit px-1"
        >
          계정 삭제
        </button>
      </div>

      <PasswordChangeModal open={passwordModal} onClose={() => setPasswordModal(false)} />
      <DeleteAccountModal open={deleteModal} onClose={() => setDeleteModal(false)} />
    </section>
  )
}
