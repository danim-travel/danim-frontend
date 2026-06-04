"use client";
import { useState } from "react";
import { Button } from "@/components/common";
import { AccountSection } from "./AccountSection";
import { ProfileSection } from "./ProfileSection";
import type { Gender } from "./GenderField";

/** 회원가입 폼: 계정 섹션 + 프로필 섹션 + 제출 버튼. */
export function RegisterForm() {
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<Gender>("male");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: API 연동
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-5">
        <AccountSection password={password} onPasswordChange={setPassword} />
        <ProfileSection
          nickname={nickname}
          onNicknameChange={setNickname}
          gender={gender}
          onGenderChange={setGender}
        />
      </div>

      <Button type="submit" fullWidth className="h-[56px] text-base mt-7">
        회원가입 완료
      </Button>
    </form>
  );
}

export default RegisterForm;
