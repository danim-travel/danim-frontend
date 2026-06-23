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
import { DeleteAccountModal } from "./_components/DeleteAccountModal"
import { ProfileSection } from "./_components/ProfileSection"
import { SocialNameField } from "./_components/SocialNameField"
import { SocialBirthDayField } from "./_components/SocialBirthDayField"
import { BIRTHDATE_RULES } from "@/app/(public)/register/_constants/birthdateValidation"
import type { MeDetailResponse, UserProfileResponse } from "@/types"

/** "YYYY-MM-DD"를 [year, month, day]로 분해한다. 월/일의 leading zero는 입력 UI를 위해 제거한다. */
function splitBirthDay(birthDay: string | null | undefined): [string, string, string] {
  if (!birthDay) return ["", "", ""]
  const [y = "", m = "", d = ""] = birthDay.split("-")
  return [y, m.replace(/^0/, ""), d.replace(/^0/, "")]
}

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
  const loginType = useAuthStore(s => s.user?.loginType)
  const isHydrated = useAuthStore(s => s.isHydrated)
  // isHydrated 전에는 false로 평가 — silent refresh 중 소셜 사용자가 이메일 UI를 보는 것 방지
  const isSocial = isHydrated && (loginType === 'kakao' || loginType === 'google')

  const [nickname, setNickname] = useState(me.nickname ?? "")
  const [intro, setIntro] = useState(me.intro ?? "")
  // 소셜 사용자 전용 — 이름/생년월일 편집 상태
  const [name, setName] = useState(me.name ?? "")
  const [initialYear, initialMonth, initialDay] = splitBirthDay(me.birth_day)
  const [birthYear, setBirthYear] = useState(initialYear)
  const [birthMonth, setBirthMonth] = useState(initialMonth)
  const [birthDay, setBirthDay] = useState(initialDay)
  // 이미지 업로드 중 미리보기용 로컬 상태. profileKey === undefined 이면 me.profile_img를 그대로 사용한다.
  const [profileImg, setProfileImg] = useState<string | null>(null)
  // undefined = 변경 없음 / null = 이미지 삭제 / string = 새 S3 key
  const [profileKey, setProfileKey] = useState<string | null | undefined>(undefined)
  // 저장/취소 시 ProfileSection을 remount해 blob previewUrl을 초기화한다
  const [profileSectionKey, setProfileSectionKey] = useState(0)

  // profileKey가 없으면 서버에서 받은 원본 이미지를, 있으면 업로드 중인 로컬 미리보기를 표시한다
  const displayedProfileImg = profileKey === undefined ? me.profile_img : profileImg
  // 닉네임 중복확인 버튼 클릭 후 통과 여부. 닉네임 입력 변경 시 초기화된다.
  const [nicknameChecked, setNicknameChecked] = useState(false)
  const [isCheckingNickname, setIsCheckingNickname] = useState(false)
  const nicknameAtCheckRef = useRef<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)

  // 소셜 사용자 전용 유효성 — 이름/생년월일이 채워져야 저장 가능
  const composedBirthDay = birthYear && birthMonth && birthDay
    ? `${birthYear}-${birthMonth.padStart(2, "0")}-${birthDay.padStart(2, "0")}`
    : ""
  const isNameValid = (name ?? "").trim().length > 0
  const isBirthValid =
    BIRTHDATE_RULES.year.test(birthYear) &&
    BIRTHDATE_RULES.month.test(birthMonth) &&
    BIRTHDATE_RULES.day.test(birthDay)

  const isDirty =
    nickname !== me.nickname ||
    intro !== (me.intro ?? "") ||
    profileKey !== undefined

  function handleCancel() {
    setNickname(me.nickname ?? "")
    setIntro(me.intro ?? "")
    if (isSocial) {
      setName(me.name ?? "")
      // initialYear/Month/Day는 마운트 시점 값으로 저장 후 me가 갱신돼도 변하지 않는다.
      // me.birth_day(현재 prop)를 기준으로 분해해야 가장 최근 저장값으로 복구된다.
      const [curYear, curMonth, curDay] = splitBirthDay(me.birth_day)
      setBirthYear(curYear)
      setBirthMonth(curMonth)
      setBirthDay(curDay)
    }
    setProfileImg(null)
    setProfileKey(undefined)
    setProfileSectionKey(k => k + 1)
    setNicknameChecked(false)
    toast.success("변경사항이 취소되었습니다.")
  }

  async function handleNicknameCheck() {
    if (nickname === me.nickname) {
      toast.error("현재 사용 중인 닉네임입니다.")
      return
    }
    const target = nickname
    nicknameAtCheckRef.current = target
    setIsCheckingNickname(true)
    try {
      await checkNickname(target)
      if (nicknameAtCheckRef.current === target) {
        setNicknameChecked(true)
        toast.success("사용 가능한 닉네임입니다.")
      }
    } catch (err) {
      setNicknameChecked(false)
      toast.error(getApiErrorMessage(err, { client: "이미 사용 중인 닉네임입니다." }))
    } finally {
      setIsCheckingNickname(false)
    }
  }

  async function handleSaveName(): Promise<boolean> {
    try {
      const updated = await updateUser({ name: (name ?? "").trim() })
      // PATCH 응답으로 캐시를 즉시 패치 — locked 표시가 stale 값(카카오/구글)을 보여주는 문제 방지
      setName(updated.name ?? name)
      queryClient.setQueryData<MeDetailResponse>(queryKeys.users.me, (old) =>
        old ? { ...old, name: updated.name ?? old.name } : old
      )
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.me })
      return true
    } catch (err) {
      toast.error(getApiErrorMessage(err, { client: "이름 저장에 실패했습니다." }))
      return false
    }
  }

  async function handleSaveBirthDay(): Promise<boolean> {
    try {
      const updated = await updateUser({ birth_day: composedBirthDay })
      // PATCH 응답으로 캐시를 즉시 패치 — locked 표시가 stale 값(2001-01-01)을 보여주는 문제 방지
      // 부분 응답일 때 상태를 빈 값으로 덮어쓰지 않도록 birth_day가 있을 때만 분해
      if (updated.birth_day) {
        const [y, m, d] = splitBirthDay(updated.birth_day)
        setBirthYear(y)
        setBirthMonth(m)
        setBirthDay(d)
      }
      queryClient.setQueryData<MeDetailResponse>(queryKeys.users.me, (old) =>
        old ? { ...old, birth_day: updated.birth_day ?? old.birth_day } : old
      )
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.me })
      return true
    } catch (err) {
      toast.error(getApiErrorMessage(err, { client: "생년월일 저장에 실패했습니다." }))
      return false
    }
  }

  async function handleSave() {
    if (!isDirty || isPending) return
    setIsPending(true)
    try {
      const updated = await updateUser({
        nickname: nickname !== me.nickname ? nickname : undefined,
        intro: intro !== me.intro ? intro : undefined,
        key: profileKey !== undefined ? (profileKey ?? "") : undefined,
      })
      setProfileKey(undefined)
      setProfileSectionKey(k => k + 1)
      setNicknameChecked(false)

      // 마이페이지가 실제로 사용하는 키와 정확히 동일하게 맞추기 위해 authStore의 userId를 우선 사용
      // (PATCH 응답에서 user_id가 누락/상이한 경우의 키 미스매치 방지)
      const profileUserId = useAuthStore.getState().user?.userId ?? updated.user_id

      // 1) PATCH 응답으로 캐시를 즉시 패치 — 마이페이지 first paint 부터 새 값 반영
      //    응답이 부분 객체일 수 있으므로 undefined 필드는 기존 캐시 값을 유지한다
      queryClient.setQueryData<UserProfileResponse>(
        queryKeys.users.profile(profileUserId),
        (old) => old ? {
          ...old,
          nickname: updated.nickname ?? old.nickname,
          // profile_img는 null(삭제)이 유효한 값이므로 undefined일 때만 기존 값 유지
          profile_img: updated.profile_img !== undefined ? updated.profile_img : old.profile_img,
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
      //    응답에 해당 필드가 없으면(undefined) 기존 authStore 값을 유지해 undefined가 persist되는 것을 방지
      const currentAuthUser = useAuthStore.getState().user
      updateAuthUser({
        userId: updated.user_id,
        nickname: updated.nickname ?? currentAuthUser?.nickname ?? "",
        profileImg: updated.profile_img !== undefined ? updated.profile_img : (currentAuthUser?.profileImg ?? null),
      })
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
          nicknameChecked={nicknameChecked}
          isCheckingNickname={isCheckingNickname}
          onNicknameChange={(v) => {
            setNickname(v)
            setNicknameChecked(false)
            nicknameAtCheckRef.current = null
          }}
          onNicknameCheck={() => { void handleNicknameCheck() }}
          nameField={isSocial ? (
            <SocialNameField
              me={me}
              name={name}
              isNameValid={isNameValid}
              nameError={name.length > 0 && !isNameValid ? "이름을 입력해주세요" : undefined}
              onNameChange={setName}
              onSave={handleSaveName}
            />
          ) : undefined}
          birthDayField={isSocial ? (
            <SocialBirthDayField
              me={me}
              birthYear={birthYear}
              birthMonth={birthMonth}
              birthDay={birthDay}
              isBirthValid={isBirthValid}
              birthError={(birthYear || birthMonth || birthDay) && !isBirthValid ? "생년월일을 올바르게 입력해주세요" : undefined}
              onBirthYearChange={setBirthYear}
              onBirthMonthChange={setBirthMonth}
              onBirthDayChange={setBirthDay}
              onSave={handleSaveBirthDay}
            />
          ) : undefined}
        />

        {!isSocial && <AccountSection />}

        {/* 하단 저장 바 */}
        <div className="flex items-center gap-3 pt-2 pb-6">
          {isSocial && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteModal(true)}
                className="text-(--color-error) border-(--color-error) hover:bg-(--color-error)/5"
              >
                계정 삭제
              </Button>
              <DeleteAccountModal open={deleteModal} onClose={() => setDeleteModal(false)} />
            </>
          )}
          <div className="flex items-center gap-3 ml-auto">
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
              disabled={!isDirty || isPending || (nickname !== me.nickname && !nicknameChecked)}
              onClick={handleSave}
            >
              변경사항 저장
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
