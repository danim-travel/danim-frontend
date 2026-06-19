"use client"

import { useRouter } from "next/navigation"
import { logout } from "@/lib/api/auth"
import { useAuthStore } from "@/store/authStore"
import { toast } from "@/store/toastStore"
import { Button } from "@/components/common/Button/Button"
import { Modal } from "@/components/common/Modal/Modal"

interface LogoutModalProps {
  open: boolean
  onClose: () => void
}

export function LogoutModal({ open, onClose }: LogoutModalProps) {
  const router = useRouter()
  const clearAuth = useAuthStore(s => s.clearAuth)

  const handleLogout = async () => {
    try { await logout() } catch { /* 실패해도 클라이언트 정리 진행 */ }
    clearAuth()
    toast.success("로그아웃 되었습니다.")
    onClose()
    router.push("/login")
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="로그아웃"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>취소</Button>
          <Button variant="primary" onClick={() => { void handleLogout() }}>확인</Button>
        </>
      }
      footerAlign="end"
    >
      <p className="text-body-sm text-text">로그아웃 하시겠습니까?</p>
    </Modal>
  )
}

export default LogoutModal
