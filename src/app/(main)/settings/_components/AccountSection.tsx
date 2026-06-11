"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { logout } from "@/lib/api/auth"
import { useAuthStore } from "@/store/authStore"
import { PasswordChangeModal } from "./PasswordChangeModal"
import { DeleteAccountModal } from "./DeleteAccountModal"
import { SettingsRow } from "@/components/common"

export function AccountSection() {
  const router = useRouter()
  const clearAuth = useAuthStore(s => s.clearAuth)

  const [passwordModal, setPasswordModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)

  return (
    <section>
      <h2 className="text-body-lg font-bold text-text mb-4">계정 &amp; 보안</h2>
      <div className="bg-bg-card border border-border rounded-card shadow-surface p-6 flex flex-col gap-3">
        <SettingsRow
          title="비밀번호 변경"
          description="마지막 변경일: 3개월 전"
          onClick={() => setPasswordModal(true)}
        />
        <SettingsRow
          title="로그아웃"
          description="현재 계정에서 로그아웃합니다."
          onClick={async () => {
            try { await logout() } catch { /* 실패해도 클라이언트 정리 진행 */ }
            clearAuth()
            router.push("/login")
          }}
        />
        <SettingsRow
          title="계정 삭제"
          description="계정과 모든 데이터가 영구 삭제됩니다."
          onClick={() => setDeleteModal(true)}
          variant="danger"
        />
      </div>

      <PasswordChangeModal open={passwordModal} onClose={() => setPasswordModal(false)} />
      <DeleteAccountModal open={deleteModal} onClose={() => setDeleteModal(false)} />
    </section>
  )
}
