"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { logout } from "@/lib/api/auth"
import { useAuthStore } from "@/store/authStore"
import { getApiErrorMessage } from "@/lib/apiError"
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
      clearAuth()
      toast.success("로그아웃 되었습니다.")
      onClose()
      router.push("/login")
    } catch (err) {
      toast.error(getApiErrorMessage(err, { client: "로그아웃에 실패했습니다." }))
    } finally {
      setIsLoading(false)
    }
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
