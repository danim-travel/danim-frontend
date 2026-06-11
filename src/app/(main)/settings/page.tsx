"use client"
import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getMe, updateUser } from "@/lib/api/users"
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
  const setAuth = useAuthStore(s => s.setAuth)
  const accessToken = useAuthStore(s => s.accessToken)

  const [nickname, setNickname] = useState(me.nickname)
  const [intro, setIntro] = useState(me.intro)
  const [profileImg, setProfileImg] = useState<string | null>(me.profile_img)
  const [isPending, setIsPending] = useState(false)

  const isDirty =
    nickname !== me.nickname ||
    intro !== me.intro ||
    profileImg !== me.profile_img

  function handleCancel() {
    setNickname(me.nickname)
    setIntro(me.intro)
    setProfileImg(me.profile_img)
  }

  async function handleSave() {
    if (!isDirty || isPending) return
    setIsPending(true)
    try {
      const updated = await updateUser({
        nickname: nickname !== me.nickname ? nickname : undefined,
        intro: intro !== me.intro ? intro : undefined,
        profile_img: profileImg !== me.profile_img ? profileImg : undefined,
      })
      queryClient.setQueryData(queryKeys.users.me, updated)
      if (accessToken && (updated.nickname !== me.nickname || updated.profile_img !== me.profile_img)) {
        setAuth(
          { userId: updated.user_id, nickname: updated.nickname, profileImg: updated.profile_img },
          accessToken,
        )
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
          me={me}
          intro={intro}
          profileImg={profileImg}
          onIntroChange={setIntro}
          onProfileImgChange={setProfileImg}
        />

        <BasicInfoSection
          me={me}
          nickname={nickname}
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
            disabled={!isDirty}
            onClick={handleSave}
          >
            변경사항 저장
          </Button>
        </div>
      </div>
    </div>
  )
}
