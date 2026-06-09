"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { Button, Modal, PasswordField } from "@/components/common"
import { changePassword, deleteUser } from "@/lib/api/users"
import { getApiErrorMessage } from "@/lib/apiError"
import { useAuthStore } from "@/store/authStore"
import { toast } from "@/store/toastStore"

export function AccountSection() {
  const router = useRouter()
  const clearAuth = useAuthStore(s => s.clearAuth)

  const [passwordModal, setPasswordModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isPwPending, setIsPwPending] = useState(false)
  const [isDeletePending, setIsDeletePending] = useState(false)

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error("새 비밀번호가 일치하지 않습니다.")
      return
    }
    setIsPwPending(true)
    try {
      await changePassword({ current_password: currentPassword, new_password: newPassword })
      toast.success("비밀번호가 변경되었습니다.")
      setPasswordModal(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      toast.error(getApiErrorMessage(err, { client: "비밀번호 변경에 실패했습니다." }))
    } finally {
      setIsPwPending(false)
    }
  }

  async function handleDeleteAccount() {
    setIsDeletePending(true)
    try {
      await deleteUser()
      clearAuth()
      router.push("/login")
    } catch (err) {
      toast.error(getApiErrorMessage(err, { client: "회원 탈퇴에 실패했습니다." }))
      setIsDeletePending(false)
    }
  }

  return (
    <section>
      <h2 className="text-body-lg font-bold text-text mb-4">계정 &amp; 보안</h2>
      <div className="bg-bg-card border border-border rounded-card shadow-sm p-6 flex flex-col gap-3">

        {/* 비밀번호 변경 */}
        <button
          type="button"
          onClick={() => setPasswordModal(true)}
          className="flex items-center justify-between w-full px-5 py-4 rounded-input bg-(--input-bg) border border-border hover:bg-bg transition-colors text-left"
        >
          <div className="flex flex-col gap-1">
            <span className="text-body-sm font-bold text-text">비밀번호 변경</span>
            <span className="text-caption text-text-muted">마지막 변경일: 3개월 전</span>
          </div>
          <ChevronRight size={18} className="text-text-muted shrink-0" />
        </button>

        {/* 로그아웃 */}
        <button
          type="button"
          onClick={() => { clearAuth(); router.push("/login") }}
          className="flex items-center justify-between w-full px-5 py-4 rounded-input bg-(--input-bg) border border-border hover:bg-bg transition-colors text-left"
        >
          <div className="flex flex-col gap-1">
            <span className="text-body-sm font-bold text-text">로그아웃</span>
            <span className="text-caption text-text-muted">현재 계정에서 로그아웃합니다.</span>
          </div>
          <ChevronRight size={18} className="text-text-muted shrink-0" />
        </button>

        {/* 계정 삭제 */}
        <button
          type="button"
          onClick={() => setDeleteModal(true)}
          className="flex items-center justify-between w-full px-5 py-4 rounded-input bg-(--color-error-bg) border border-(--color-border-error) hover:opacity-90 transition-colors text-left"
        >
          <div className="flex flex-col gap-1">
            <span className="text-body-sm font-bold text-(--color-error)">계정 삭제</span>
            <span className="text-caption text-(--color-error)">계정과 모든 데이터가 영구 삭제됩니다.</span>
          </div>
          <ChevronRight size={18} className="text-(--color-error) shrink-0" />
        </button>
      </div>

      {/* 비밀번호 변경 모달 */}
      <Modal
        open={passwordModal}
        onClose={() => setPasswordModal(false)}
        title="비밀번호 변경"
        footer={
          <>
            <Button variant="outline" onClick={() => setPasswordModal(false)}>취소</Button>
            <Button variant="primary" form="pw-form" type="submit" loading={isPwPending} disabled={isPwPending}>
              변경
            </Button>
          </>
        }
      >
        <form id="pw-form" onSubmit={handlePasswordChange} className="flex flex-col gap-4">
          <PasswordField
            label="현재 비밀번호"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <PasswordField
            label="새 비밀번호"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <PasswordField
            label="새 비밀번호 확인"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            error={confirmPassword && newPassword !== confirmPassword ? "비밀번호가 일치하지 않습니다." : undefined}
            autoComplete="new-password"
          />
        </form>
      </Modal>

      {/* 계정 삭제 확인 모달 */}
      <Modal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="계정 삭제"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteModal(false)}>취소</Button>
            <Button variant="primary" loading={isDeletePending} disabled={isDeletePending} onClick={handleDeleteAccount}>
              삭제하기
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-text-muted">
          계정과 모든 데이터가 영구 삭제됩니다.<br />
          정말 삭제하시겠습니까?
        </p>
      </Modal>
    </section>
  )
}
