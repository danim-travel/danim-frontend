"use client";
import { useFormContext, useController } from "react-hook-form";
import { TextField, FieldLabel } from "@/components/common";
import { NICKNAME_RULES } from "../../_constants/passwordValidation";
import type { RegisterFormValues } from "../_schema";

const INPUT_CLASS = "h-12 text-center px-2";

export function ProfileSection() {
  const { control, formState: { errors } } = useFormContext<RegisterFormValues>();

  const { field: nicknameField } = useController({ control, name: "nickname" });
  const { field: nameField } = useController({ control, name: "name" });
  const { field: birthYearField } = useController({ control, name: "birthYear" });
  const { field: birthMonthField } = useController({ control, name: "birthMonth" });
  const { field: birthDayField } = useController({ control, name: "birthDay" });

  const birthDateError =
    errors.birthYear?.message || errors.birthMonth?.message || errors.birthDay?.message;

  return (
    <div className="flex flex-col gap-5 pt-7 border-t border-border-subtle">
      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="이름"
          required
          type="text"
          placeholder="실명을 입력해주세요"
          className="h-12"
          {...nameField}
          error={errors.name?.message}
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
                {...birthYearField}
                onChange={(e) => birthYearField.onChange(e.target.value.replace(/\D/g, ""))}
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
                {...birthMonthField}
                onChange={(e) => birthMonthField.onChange(e.target.value.replace(/\D/g, ""))}
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
                {...birthDayField}
                onChange={(e) => birthDayField.onChange(e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>
          {birthDateError && (
            <span className="block mt-2 text-caption text-error">{birthDateError}</span>
          )}
        </div>
      </div>

      <TextField
        label="닉네임"
        required
        placeholder="영문, 한글, 숫자 2~20자"
        helperText={errors.nickname?.message ? undefined : "다른 사용자에게 보이는 이름이에요. 나중에 변경할 수 있어요."}
        error={errors.nickname?.message}
        className="h-12"
        {...nicknameField}
        onChange={(e) => nicknameField.onChange(e.target.value.replace(NICKNAME_RULES.inputFilter, "").slice(0, NICKNAME_RULES.maxLength))}
        rightSlot={
          <span className="text-caption text-text-disabled whitespace-nowrap">
            {nicknameField.value.length} / {NICKNAME_RULES.maxLength}
          </span>
        }
      />
    </div>
  );
}

export default ProfileSection;
