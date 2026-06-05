"use client";
import { TextField, Segmented, FieldLabel } from "@/components/common";

const NICK_MAX = 20;
const INPUT_CLASS = "h-12 text-center px-2";

export type Gender = "male" | "female";

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
        <div>
          <FieldLabel>성별</FieldLabel>
          <Segmented
            fullWidth
            size="lg"
            value={gender}
            onChange={(key) => onGenderChange(key as Gender)}
            items={[
              { key: "male", label: "남성" },
              { key: "female", label: "여성" },
            ]}
          />
        </div>
      </div>

      <div>
        <label htmlFor="birthdate-year" className="block mb-2 text-label font-semibold text-text-secondary">
          생년월일
        </label>
        <div className="flex gap-2">
          <div className="flex-[1.2]">
            <TextField
              id="birthdate-year"
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="YYYY"
              aria-label="출생 연도"
              className={INPUT_CLASS}
            />
          </div>
          <div className="flex-1">
            <TextField
              type="text"
              inputMode="numeric"
              maxLength={2}
              placeholder="MM"
              aria-label="출생 월"
              className={INPUT_CLASS}
            />
          </div>
          <div className="flex-1">
            <TextField
              type="text"
              inputMode="numeric"
              maxLength={2}
              placeholder="DD"
              aria-label="출생 일"
              className={INPUT_CLASS}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileSection;
