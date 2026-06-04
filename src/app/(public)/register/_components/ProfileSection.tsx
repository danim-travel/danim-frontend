"use client";
import { TextField } from "@/components/common";
import { GenderField, type Gender } from "./GenderField";
import { BirthdateField } from "./BirthdateField";

const NICK_MAX = 20;

export interface ProfileSectionProps {
  nickname: string;
  onNicknameChange: (value: string) => void;
  gender: Gender;
  onGenderChange: (value: Gender) => void;
}

/** 회원가입 프로필 섹션: 닉네임/이름/성별/생년월일. */
export function ProfileSection({ nickname, onNicknameChange, gender, onGenderChange }: ProfileSectionProps) {
  return (
    <div className="flex flex-col gap-5 pt-7 border-t border-border-subtle">
      <TextField
        label="닉네임"
        required
        value={nickname}
        onChange={(e) => onNicknameChange(e.target.value.slice(0, NICK_MAX))}
        placeholder="영문, 한글, 숫자 포함 2~20자"
        helperText="다른 사용자에게 보이는 이름이에요. 나중에 변경할 수 있어요."
        className="h-12"
        rightSlot={
          <span className="text-caption text-text-disabled whitespace-nowrap">
            {nickname.length} / {NICK_MAX}
          </span>
        }
      />

      <div className="grid grid-cols-2 gap-4">
        <TextField label="이름" required type="text" placeholder="실명을 입력해주세요" className="h-12" />
        <GenderField value={gender} onChange={onGenderChange} />
      </div>

      <BirthdateField />
    </div>
  );
}

export default ProfileSection;
