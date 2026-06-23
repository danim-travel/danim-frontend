"use client"

import { useState } from "react"
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
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await logout()
    } catch {
      // refresh_token 쿠키가 없는 경우(비밀번호 변경 후 등) 400이 오지만
      // 서버 측 토큰이 이미 없는 상태이므로 클라이언트 정리 후 로그인으로 이동
    } finally {
      setIsLoading(false)
    }
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
      className="max-w-sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>취소</Button>
          <Button variant="primary" loading={isLoading} disabled={isLoading} onClick={() => { void handleLogout() }}>확인</Button>
        </>
      }
      footerAlign="end"
    >
      <p className="text-body-sm text-text">로그아웃 하시겠습니까?</p>
    </Modal>
  )
}

export default LogoutModal
