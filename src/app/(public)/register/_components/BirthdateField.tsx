import { TextField } from "@/components/common";

const INPUT_CLASS = "h-12 text-center px-2";

/** 생년월일 입력 필드 (YYYY / MM / DD). */
export function BirthdateField() {
  return (
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
  );
}

export default BirthdateField;
