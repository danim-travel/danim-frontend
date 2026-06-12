"use client"
import { useState, useRef } from "react"
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
  const setAuth = useAuthStore(s => s.setAuth)
  const accessToken = useAuthStore(s => s.accessToken)

  const [nickname, setNickname] = useState(me.nickname)
  const [intro, setIntro] = useState(me.intro)
  const [profileImg, setProfileImg] = useState<string | null>(me.profile_img)
  // undefined = 변경 없음 / null = 이미지 삭제 / string = 새 S3 key
  const [profileKey, setProfileKey] = useState<string | null | undefined>(undefined)
  const [nicknameError, setNicknameError] = useState<string | undefined>(undefined)
  const [isCheckingNickname, setIsCheckingNickname] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const nicknameCheckGen = useRef(0)
  // blur로 시작된 닉네임 검사와 저장 버튼 클릭을 조율하기 위한 refs
  const nicknameCheckPending = useRef<Promise<void> | null>(null)
  const nicknameErrorRef = useRef<string | undefined>(undefined)

  const isDirty =
    nickname !== me.nickname ||
    intro !== me.intro ||
    profileKey !== undefined

  function handleCancel() {
    nicknameCheckGen.current++
    setNickname(me.nickname)
    setIntro(me.intro)
    setProfileImg(me.profile_img)
    setProfileKey(undefined)
    setNicknameError(undefined)
    nicknameErrorRef.current = undefined
    setIsCheckingNickname(false)
    nicknameCheckPending.current = null
    toast.success("변경사항이 취소되었습니다.")
  }

  async function handleNicknameBlur() {
    if (!nickname.trim() || nickname === me.nickname) {
      setNicknameError(undefined)
      nicknameErrorRef.current = undefined
      return
    }
    const gen = ++nicknameCheckGen.current
    setIsCheckingNickname(true)
    nicknameCheckPending.current = (async () => {
      try {
        await checkNickname(nickname)
        if (gen === nicknameCheckGen.current) {
          setNicknameError(undefined)
          nicknameErrorRef.current = undefined
        }
      } catch (err) {
        if (gen === nicknameCheckGen.current) {
          const msg = getApiErrorMessage(err, { client: "이미 사용 중인 닉네임입니다." })
          setNicknameError(msg)
          nicknameErrorRef.current = msg
        }
      } finally {
        if (gen === nicknameCheckGen.current) {
          setIsCheckingNickname(false)
          nicknameCheckPending.current = null
        }
      }
    })()
  }

  async function handleSave() {
    if (!isDirty || isPending) return
    // 블러로 시작된 닉네임 검사가 진행 중이면 결과를 기다린 후 저장 여부를 판단한다
    if (nicknameCheckPending.current) await nicknameCheckPending.current
    if (nicknameErrorRef.current) return
    setIsPending(true)
    try {
      const updated = await updateUser({
        nickname: nickname !== me.nickname ? nickname : undefined,
        intro: intro !== me.intro ? intro : undefined,
        key: profileKey !== undefined ? profileKey : undefined,
      })
      queryClient.setQueryData(queryKeys.users.me, updated)
      setProfileImg(updated.profile_img)
      setProfileKey(undefined)
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
          onProfileKeyChange={setProfileKey}
        />

        <BasicInfoSection
          me={me}
          nickname={nickname}
          nicknameError={nicknameError}
          onNicknameChange={(v) => {
            setNickname(v)
            setNicknameError(undefined)
            nicknameErrorRef.current = undefined
          }}
          onNicknameBlur={() => { void handleNicknameBlur() }}
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
            disabled={!isDirty || !!nicknameError || isPending || isCheckingNickname}
            onClick={handleSave}
          >
            변경사항 저장
          </Button>
        </div>
      </div>
    </div>
  )
}
