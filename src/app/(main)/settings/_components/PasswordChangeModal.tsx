"use client"
import { useState } from "react"
import { Button, Modal, PasswordField } from "@/components/common"
import { changePassword } from "@/lib/api/users"
import { getApiErrorMessage, isApiError } from "@/lib/apiError"
import { toast } from "@/store/toastStore"

interface PasswordChangeModalProps {
  open: boolean
  onClose: () => void
}

export function PasswordChangeModal({ open, onClose }: PasswordChangeModalProps) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [currentPasswordError, setCurrentPasswordError] = useState<string | undefined>()
  const [newPasswordError, setNewPasswordError] = useState<string | undefined>()
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | undefined>()
  const [isPending, setIsPending] = useState(false)

  function handleClose() {
    onClose()
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setCurrentPasswordError(undefined)
    setNewPasswordError(undefined)
    setConfirmPasswordError(undefined)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const nextNewPasswordError =
      newPassword.trim().length === 0
        ? "새 비밀번호를 입력해주세요"
        : currentPassword === newPassword
          ? "현재 비밀번호와 다른 비밀번호를 입력해주세요"
          : undefined
    const nextConfirmPasswordError =
      confirmPassword.trim().length === 0
        ? "비밀번호 확인을 입력해주세요"
        : newPassword !== confirmPassword
          ? "비밀번호가 일치하지 않습니다."
          : undefined

    setNewPasswordError(nextNewPasswordError)
    setConfirmPasswordError(nextConfirmPasswordError)

    if (nextNewPasswordError || nextConfirmPasswordError) return

    setIsPending(true)
    setCurrentPasswordError(undefined)
    try {
      await changePassword({ password: currentPassword, new_password: newPassword })
      toast.success("비밀번호가 변경되었습니다.")
      handleClose()
    } catch (err) {
      if (isApiError(err) && err.status === 400) {
        setCurrentPasswordError(getApiErrorMessage(err, { client: "현재 비밀번호가 틀렸습니다." }))
      } else {
        toast.error(getApiErrorMessage(err, { client: "비밀번호 변경에 실패했습니다." }))
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="비밀번호 변경"
      className="max-w-3xl"
      footer={
        <Button variant="primary" form="pw-form" type="submit" loading={isPending} disabled={isPending} className="w-full">
          확인
        </Button>
      }
      footerAlign="stretch"
    >
      <form id="pw-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <PasswordField
          label="현재 비밀번호"
          placeholder="현재 비밀번호를 입력해 주세요"
          value={currentPassword}
          onChange={e => { setCurrentPassword(e.target.value); setCurrentPasswordError(undefined) }}
          required
          autoComplete="current-password"
          name="danim-current-password"
          error={currentPasswordError}
        />
        <PasswordField
          label="새 비밀번호"
          placeholder="새 비밀번호를 입력해 주세요"
          value={newPassword}
          onChange={e => { setNewPassword(e.target.value); setNewPasswordError(undefined) }}
          required
          autoComplete="new-password"
          name="danim-new-password"
          helperText="영문, 숫자, 특수문자 포함 8자 이상"
          error={newPasswordError}
        />
        <PasswordField
          label="새 비밀번호 확인"
          placeholder="새 비밀번호를 한 번 더 입력해 주세요"
          value={confirmPassword}
          onChange={e => { setConfirmPassword(e.target.value); setConfirmPasswordError(undefined) }}
          required
          autoComplete="new-password"
          name="danim-confirm-password"
          error={confirmPasswordError}
        />
      </form>
    </Modal>
  )
}
