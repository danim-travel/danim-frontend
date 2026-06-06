"use client";
import { TextField, FieldLabel } from "@/components/common";

const NICK_MAX = 20;
const INPUT_CLASS = "h-12 text-center px-2";

export interface ProfileSectionProps {
  nickname: string;
  onNicknameChange: (value: string) => void;
  nicknameError?: string;
  name: string;
  onNameChange: (value: string) => void;
  nameError?: string;
  birthYear: string;
  onBirthYearChange: (value: string) => void;
  birthMonth: string;
  onBirthMonthChange: (value: string) => void;
  birthDay: string;
  onBirthDayChange: (value: string) => void;
  birthDateError?: string;
}

export function ProfileSection({
  nickname,
  onNicknameChange,
  nicknameError,
  name,
  onNameChange,
  nameError,
  birthYear,
  onBirthYearChange,
  birthMonth,
  onBirthMonthChange,
  birthDay,
  onBirthDayChange,
  birthDateError,
}: ProfileSectionProps) {
  return (
    <div className="flex flex-col gap-5 pt-7 border-t border-border-subtle">
      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="이름"
          required
          type="text"
          placeholder="실명을 입력해주세요"
          className="h-12"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          error={nameError}
        />
        <div>
          <FieldLabel htmlFor="birthdate-year">생년월일</FieldLabel>
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
                value={birthYear}
                onChange={(e) => onBirthYearChange(e.target.value.replace(/\D/g, ""))}
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
                value={birthMonth}
                onChange={(e) => onBirthMonthChange(e.target.value)}
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
                value={birthDay}
                onChange={(e) => onBirthDayChange(e.target.value)}
              />
            </div>
          </div>
          {birthDateError && (
            <span className="block mt-2 text-caption text-(--input-text-error)">{birthDateError}</span>
          )}
        </div>
      </div>

      <TextField
        label="닉네임"
        required
        value={nickname}
        onChange={(e) => onNicknameChange(e.target.value.replace(/[^a-zA-Z0-9가-힣]/g, "").slice(0, NICK_MAX))}
        placeholder="영문, 한글, 숫자 2~20자"
        helperText={nicknameError ? undefined : "다른 사용자에게 보이는 이름이에요. 나중에 변경할 수 있어요."}
        error={nicknameError}
        className="h-12"
        rightSlot={
          <span className="text-caption text-text-disabled whitespace-nowrap">
            {nickname.length} / {NICK_MAX}
          </span>
        }
      />
    </div>
  );
}

export default ProfileSection;
