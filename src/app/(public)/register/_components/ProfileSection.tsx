"use client";
import { useFormContext, useController } from "react-hook-form";
import { TextField, FieldLabel, VerificationField } from "@/components/common";
import { NICKNAME_RULES } from "../_constants/nicknameValidation";
import { useNicknameCheck } from "../_hooks/useNicknameCheck";
import type { RegisterFormValues } from "../_schema";

const INPUT_CLASS = "h-12 text-center px-2";

export function ProfileSection() {
  // FormProvider로 공유된 폼 컨텍스트에서 필요한 것만 꺼냄
  // control: 각 필드를 RHF에 연결 / errors: 필드 에러 메시지
  const { control, setValue, formState: { errors } } = useFormContext<RegisterFormValues>();

  const { field: nicknameField } = useController({ control, name: "nickname" });
  const { field: nameField } = useController({ control, name: "name" });
  const { field: birthYearField } = useController({ control, name: "birthYear" });
  const { field: birthMonthField } = useController({ control, name: "birthMonth" });
  const { field: birthDayField } = useController({ control, name: "birthDay" });

  const { checking, result: nicknameResult, checkDuplicate, reset: resetNickname, canCheck } = useNicknameCheck();

  // 년/월/일 중 첫 번째 에러 메시지만 노출
  const birthDateError =
    errors.birthYear?.message || errors.birthMonth?.message || errors.birthDay?.message;

  // 폼 에러 > 중복확인 결과(성공/실패) > 기본 안내 순으로 우선순위
  const nicknameHelperTone =
    errors.nickname?.message ? "error"        // Zod 유효성 에러가 있으면 → 빨강
    : nicknameResult?.ok === true ? "primary" // 중복확인 통과했으면 → 초록
    : nicknameResult?.ok === false ? "error"  // 중복확인 실패했으면 → 빨강
    : "muted";                                // 아무것도 없으면 → 회색

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
                // 숫자 외 문자 입력 즉시 제거
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

      <VerificationField
        label="닉네임"
        required
        placeholder="영문, 숫자, _, . 사용 가능 (2~10자)"
        className="h-12"
        {...nicknameField}
        onChange={(e) => {
          // 허용 문자 외 즉시 제거 + 최대 길이 제한
          nicknameField.onChange(e.target.value.replace(NICKNAME_RULES.inputFilter, "").slice(0, NICKNAME_RULES.maxLength));
          resetNickname();
          setValue("nicknameChecked", false, { shouldValidate: false });
        }}
        actionLabel="중복확인"
        actionVariant="outline"
        actionDisabled={checking || !canCheck(nicknameField.value)}
        actionLoading={checking}
        onAction={async () => {
          const ok = await checkDuplicate(nicknameField.value);
          setValue("nicknameChecked", ok, { shouldValidate: true });
        }}
        helperText={
          errors.nickname?.message ??
          errors.nicknameChecked?.message ??
          (nicknameResult ? nicknameResult.message : "다른 사용자에게 보이는 이름이에요. 나중에 변경할 수 있어요.")
        }
        helperTone={nicknameHelperTone}
      />
    </div>
  );
}

export default ProfileSection;
