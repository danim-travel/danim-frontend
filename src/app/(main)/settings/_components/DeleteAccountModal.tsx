"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import { Button, Checkbox, Modal, TextField } from "@/components/common"
import { deleteUser } from "@/lib/api/users"
import { getApiErrorMessage } from "@/lib/apiError"
import { useAuthStore } from "@/store/authStore"
import { toast } from "@/store/toastStore"

type ChecklistItem =
  | { text: string }
  | { before: string; bold: string; after: string }

const DELETE_CHECKLIST: ChecklistItem[] = [
  { before: '계정 삭제 요청 시 ', bold: '3일간 유예기간', after: '이 적용됩니다.' },
  { before: '유예기간 동안 계정은 ', bold: '비활성화', after: '됩니다.' },
  { text: '3일 이내 다시 로그인하면 계정 삭제 요청을 취소할 수 있습니다.' },
  { before: '3일 이후에는 관련 데이터가 ', bold: '영구 삭제', after: '되며 복구할 수 없습니다.' },
  { text: '프로필, 게시글, 댓글, 좋아요, 저장 내역, 팔로워/팔로잉이 포함됩니다.' },
]

interface DeleteAccountModalProps {
  open: boolean
  onClose: () => void
}

export function DeleteAccountModal({ open, onClose }: DeleteAccountModalProps) {
  const router = useRouter()
  const clearAuth = useAuthStore(s => s.clearAuth)

  const [agreed, setAgreed] = useState(false)
  const [confirmPhrase, setConfirmPhrase] = useState("")
  const [isPending, setIsPending] = useState(false)
  const canDelete = agreed && confirmPhrase === "삭제하겠습니다"

  function handleClose() {
    onClose()
    setAgreed(false)
    setConfirmPhrase("")
  }

  async function handleDelete() {
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
          <Button variant="primary" loading={isPending} disabled={!canDelete || isPending} onClick={handleDelete}>
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

        <div>
          <p className="text-caption font-bold text-text-secondary mb-3">
            <span className="text-(--color-error)">주의사항</span>을 꼭 확인해 주세요
          </p>
          <div className="border border-border rounded-card p-4 flex flex-col gap-2.5">
            {DELETE_CHECKLIST.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="shrink-0 w-4 h-4 mt-0.5 rounded-pill bg-primary flex items-center justify-center">
                  <Check size={10} strokeWidth={3} className="text-text-inverse" />
                </span>
                <p className="text-caption text-text-secondary leading-relaxed">
                  {'bold' in item
                    ? <>{item.before}<strong className="text-text">{item.bold}</strong>{item.after}</>
                    : item.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <Checkbox
          checked={agreed}
          onChange={setAgreed}
          label={
            <span className="text-caption text-text">
              위 주의사항을 모두 확인했으며, 계정 삭제에 동의합니다.
            </span>
          }
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
            onChange={e => setConfirmPhrase(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  )
}
