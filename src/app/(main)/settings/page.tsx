"use client"
import { useState, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getMe, updateUser } from "@/lib/api/users"
import { checkNickname } from "@/lib/api/auth"
import { getApiErrorMessage } from "@/lib/apiError"
import { queryKeys } from "@/lib/queryKeys"
import { useAuthStore } from "@/store/authStore"
import { toast } from "@/store/toastStore"
import { Button } from "@/components/common"
import { Spinner } from "@/components/ui/spinner"
import { AccountSection } from "./_components/AccountSection"
import { BasicInfoSection } from "./_components/BasicInfoSection"
import { ProfileSection } from "./_components/ProfileSection"
import type { MeDetailResponse } from "@/types"

export default function SettingsPage() {
  const { data: me, isLoading } = useQuery({
    queryKey: queryKeys.users.me,
    queryFn: getMe,
  })

  if (isLoading || !me) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return <SettingsForm me={me} />
}

// me 가 준비된 뒤 마운트되므로 useState 초기값을 me 로부터 안전하게 설정할 수 있다
function SettingsForm({ me }: { me: MeDetailResponse }) {
  const queryClient = useQueryClient()
  const updateAuthUser = useAuthStore(s => s.updateAuthUser)

  const [nickname, setNickname] = useState(me.nickname)
  const [intro, setIntro] = useState(me.intro ?? "")
  // 이미지 업로드 중 미리보기용 로컬 상태. profileKey === undefined 이면 me.profile_img를 그대로 사용한다.
  const [profileImg, setProfileImg] = useState<string | null>(null)
  // undefined = 변경 없음 / null = 이미지 삭제 / string = 새 S3 key
  const [profileKey, setProfileKey] = useState<string | null | undefined>(undefined)
  // 저장/취소 시 ProfileSection을 remount해 blob previewUrl을 초기화한다
  const [profileSectionKey, setProfileSectionKey] = useState(0)

  // profileKey가 없으면 서버에서 받은 원본 이미지를, 있으면 업로드 중인 로컬 미리보기를 표시한다
  const displayedProfileImg = profileKey === undefined ? me.profile_img : profileImg
  const [nicknameStatus, setNicknameStatus] = useState<"idle" | "checking" | "available" | "duplicate">("idle")
  const [isPending, setIsPending] = useState(false)

  const isDirty =
    nickname !== me.nickname ||
    intro !== (me.intro ?? "") ||
    profileKey !== undefined

  // 닉네임 입력값이 바뀔 때마다 debounce 후 중복 검사를 실행한다. 기존 닉네임과 같으면 API 호출 없이 통과 처리한다.
  useEffect(() => {
    let cancelled = false
    const isUnchanged = !nickname.trim() || nickname === me.nickname

    const statusTimer = setTimeout(() => {
      if (!cancelled) setNicknameStatus(isUnchanged ? "idle" : "checking")
    }, 0)

    if (isUnchanged) {
      return () => {
        cancelled = true
        clearTimeout(statusTimer)
      }
    }

    const checkTimer = setTimeout(async () => {
      try {
        await checkNickname(nickname)
        if (!cancelled) setNicknameStatus("available")
      } catch {
        if (!cancelled) setNicknameStatus("duplicate")
      }
    }, 400)

    return () => {
      cancelled = true
      clearTimeout(statusTimer)
      clearTimeout(checkTimer)
    }
  }, [nickname, me.nickname])

  const nicknameHelperText =
    nicknameStatus === "duplicate" ? "중복되는 닉네임입니다."
    : nicknameStatus === "available" ? "사용 가능한 닉네임입니다."
    : nicknameStatus === "checking" ? "닉네임 확인 중..."
    : "다른 사용자에게 보이는 이름이에요."

  const nicknameHelperTone: "muted" | "primary" | "error" =
    nicknameStatus === "duplicate" ? "error"
    : nicknameStatus === "available" ? "primary"
    : "muted"

  function handleCancel() {
    setNickname(me.nickname)
    setIntro(me.intro ?? "")
    setProfileImg(null)
    setProfileKey(undefined)
    setProfileSectionKey(k => k + 1)
    toast.success("변경사항이 취소되었습니다.")
  }

  async function handleSave() {
    if (!isDirty || isPending) return
    if (nicknameStatus === "checking" || nicknameStatus === "duplicate") return
    setIsPending(true)
    try {
      const updated = await updateUser({
        nickname: nickname !== me.nickname ? nickname : undefined,
        intro: intro !== me.intro ? intro : undefined,
        key: profileKey !== undefined ? profileKey : undefined,
      })
      setProfileKey(undefined)
      setProfileSectionKey(k => k + 1)
      // PATCH 응답의 profile_img는 raw S3 URL일 수 있으므로, getMe()를 재호출해 presigned URL을 받는다
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.me })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.profile(updated.user_id) })
      if (updated.nickname !== me.nickname || updated.profile_img !== me.profile_img) {
        updateAuthUser({ userId: updated.user_id, nickname: updated.nickname, profileImg: updated.profile_img })
      }
      toast.success("변경사항이 저장되었습니다.")
    } catch (err) {
      toast.error(getApiErrorMessage(err, { client: "저장에 실패했습니다." }))
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-10 py-10 flex flex-col gap-8">
        <h1 className="text-section-title font-bold text-text">내 정보 수정</h1>

        <ProfileSection
          key={profileSectionKey}
          me={me}
          intro={intro}
          profileImg={displayedProfileImg}
          onIntroChange={setIntro}
          onProfileImgChange={setProfileImg}
          onProfileKeyChange={setProfileKey}
        />

        <BasicInfoSection
          me={me}
          nickname={nickname}
          nicknameHelperText={nicknameHelperText}
          nicknameHelperTone={nicknameHelperTone}
          onNicknameChange={setNickname}
        />

        <AccountSection />

        {/* 하단 저장 바 */}
        <div className="flex justify-end items-center gap-3 pt-2 pb-6">
          <Button
            type="button"
            variant="secondary"
            disabled={!isDirty || isPending}
            onClick={handleCancel}
          >
            취소
          </Button>
          <Button
            type="button"
            variant="primary"
            loading={isPending}
            disabled={!isDirty || isPending || nicknameStatus === "checking" || nicknameStatus === "duplicate"}
            onClick={handleSave}
          >
            변경사항 저장
          </Button>
        </div>
      </div>
    </div>
  )
}
