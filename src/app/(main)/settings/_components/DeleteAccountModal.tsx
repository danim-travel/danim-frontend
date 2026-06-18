"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button, Checkbox, Modal, PasswordField, TextField } from "@/components/common"
import { deleteUser } from "@/lib/api/users"
import { getApiErrorMessage } from "@/lib/apiError"
import { useAuthStore } from "@/store/authStore"
import { toast } from "@/store/toastStore"

interface DeleteAccountModalProps {
  open: boolean
  onClose: () => void
}

export function DeleteAccountModal({ open, onClose }: DeleteAccountModalProps) {
  const router = useRouter()
  const clearAuth = useAuthStore(s => s.clearAuth)

  const [agreed, setAgreed] = useState(false)
  const [password, setPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | undefined>()
  const [confirmPhrase, setConfirmPhrase] = useState("")
  const [confirmPhraseError, setConfirmPhraseError] = useState<string | undefined>()
  const [isPending, setIsPending] = useState(false)
  const canDelete = agreed && password.trim().length > 0 && confirmPhrase === "삭제하겠습니다"

  function handleClose() {
    onClose()
    setAgreed(false)
    setPassword("")
    setPasswordError(undefined)
    setConfirmPhrase("")
    setConfirmPhraseError(undefined)
  }

  async function handleDelete() {
    if (password.trim().length === 0) {
      setPasswordError("비밀번호를 입력해주세요")
      return
    }
    if (confirmPhrase.trim().length === 0) {
      setConfirmPhraseError("확인 문구를 입력해주세요")
      return
    }
    if (confirmPhrase !== "삭제하겠습니다") {
      setConfirmPhraseError("\"삭제하겠습니다\"를 정확히 입력해주세요")
      return
    }

    setIsPending(true)
    try {
      await deleteUser()
      onClose()
      clearAuth()
      router.push("/login")
    } catch (err) {
      toast.error(getApiErrorMessage(err, { client: "회원 탈퇴에 실패했습니다." }))
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="계정 삭제"
      className="max-w-3xl"
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>취소</Button>
          <Button variant="primary" loading={isPending} disabled={isPending || !canDelete} onClick={handleDelete}>
            확인
          </Button>
        </>
      }
      footerAlign="stretch"
    >
      <div className="flex flex-col gap-5">
        <div className="bg-(--color-error-bg) border border-(--color-border-error) rounded-card p-4 flex flex-col gap-1.5">
          <p className="text-body-sm font-bold text-(--color-error)">다님을 떠나시기 전에 꼭 확인해 주세요.</p>
          <p className="text-caption text-(--color-error)">
            계정을 삭제하면 지금까지 기록한 여행 게시글, 저장한 장소, 팔로우 정보가 함께 삭제됩니다.
          </p>
          <p className="text-caption text-(--color-error)">삭제 후에는 복구가 어려울 수 있습니다.</p>
        </div>

        <Checkbox
          checked={agreed}
          onChange={setAgreed}
          label={
            <span className="text-caption text-text">
              계정 삭제에 동의합니다.
            </span>
          }
        />

        <PasswordField
          label="비밀번호 입력"
          required
          placeholder="비밀번호를 입력해 주세요"
          value={password}
          onChange={e => { setPassword(e.target.value); setPasswordError(undefined) }}
          error={passwordError}
          autoComplete="current-password"
        />

        <div className="flex flex-col gap-1.5">
          <p className="text-caption text-text-muted">
            계정 삭제 요청을 진행하려면 아래 문구를 입력해 주세요. · 입력 문구 &quot;삭제하겠습니다&quot;
          </p>
          <TextField
            label="확인 문구 입력"
            required
            placeholder="삭제하겠습니다"
            value={confirmPhrase}
            onChange={e => { setConfirmPhrase(e.target.value); setConfirmPhraseError(undefined) }}
            error={confirmPhraseError}
          />
        </div>
      </div>
    </Modal>
  )
}
