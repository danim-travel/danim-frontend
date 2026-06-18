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
import type { MeDetailResponse, UserProfileResponse } from "@/types"

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
  const [nicknameError, setNicknameError] = useState<string | undefined>(undefined)
  const [isCheckingNickname, setIsCheckingNickname] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const nicknameCheckGen = useRef(0)
  // blur로 시작된 닉네임 검사와 저장 버튼 클릭을 조율하기 위한 refs
  const nicknameCheckPending = useRef<Promise<void> | null>(null)
  const nicknameErrorRef = useRef<string | undefined>(undefined)

  const isDirty =
    nickname !== me.nickname ||
    intro !== (me.intro ?? "") ||
    profileKey !== undefined

  function handleCancel() {
    nicknameCheckGen.current++
    setNickname(me.nickname)
    setIntro(me.intro ?? "")
    setProfileImg(null)
    setProfileKey(undefined)
    setProfileSectionKey(k => k + 1)
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
      setProfileKey(undefined)
      setProfileSectionKey(k => k + 1)

      // 마이페이지가 실제로 사용하는 키와 정확히 동일하게 맞추기 위해 authStore의 userId를 우선 사용
      // (PATCH 응답에서 user_id가 누락/상이한 경우의 키 미스매치 방지)
      const profileUserId = useAuthStore.getState().user?.userId ?? updated.user_id

      // 1) PATCH 응답으로 캐시를 즉시 패치 — 마이페이지 first paint 부터 새 값 반영
      queryClient.setQueryData<UserProfileResponse>(
        queryKeys.users.profile(profileUserId),
        (old) => old ? {
          ...old,
          nickname: updated.nickname,
          profile_img: updated.profile_img,
          intro: updated.intro ?? old.intro,
          name: updated.name ?? old.name,
        } : old
      )

      // 2) me는 settings에서 active observer가 있어 invalidate만으로 refetch 트리거됨.
      //    profile은 inactive(다른 페이지)라 invalidate만으로는 네트워크 호출이 안 일어남
      //    → refetchQueries로 강제 호출. 이 await가 끝나면 캐시에 서버 fresh 데이터가 들어와 있음.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.users.me }),
        queryClient.refetchQueries({ queryKey: queryKeys.users.profile(profileUserId) }),
      ])

      // 3) authStore도 동기화 — SideNav 아바타/닉네임 등 store 기반 UI 즉시 반영
      updateAuthUser({ userId: updated.user_id, nickname: updated.nickname, profileImg: updated.profile_img })
      toast.success("변경사항이 저장되었습니다.")
    } catch (err) {
      toast.error(getApiErrorMessage(err, { client: "저장에 실패했습니다." }))
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 md:px-10 md:py-10 flex flex-col gap-8">
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
