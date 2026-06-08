import { PASSWORD_RULES } from "../_constants/passwordValidation";

function getPwStrength(pw: string): { score: number; label: string; bar: string; text: string } {
  if (!pw) return { score: 0, label: "", bar: "", text: "" };
  let s = 0;
  if (pw.length >= PASSWORD_RULES.minLength) s++;
  if (PASSWORD_RULES.hasLetter.test(pw)) s++;
  if (PASSWORD_RULES.hasNumber.test(pw)) s++;
  if (PASSWORD_RULES.hasSpecial.test(pw)) s++;
  if (s <= 1) return { score: 1, label: "약함", bar: "bg-error", text: "text-error" };
  if (s === 2) return { score: 2, label: "보통", bar: "bg-warning", text: "text-warning" };
  if (s === 3) return { score: 3, label: "강함", bar: "bg-primary", text: "text-primary" };
  return { score: 4, label: "매우 강함", bar: "bg-primary", text: "text-primary" };
}

export interface PasswordStrengthProps {
  /** 평가할 비밀번호 문자열 (빈 값이면 렌더하지 않음) */
  value: string;
}

/** 비밀번호 강도 4세그먼트 바 + 라벨. */
export function PasswordStrength({ value }: PasswordStrengthProps) {
  if (!value) return null;
  const strength = getPwStrength(value);

  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="text-caption text-text-muted whitespace-nowrap">비밀번호 강도</span>
      <div className="flex-1 flex gap-1 min-w-[140px]">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i < strength.score ? strength.bar : "bg-border-subtle"}`}
          />
        ))}
      </div>
      <span className={`text-caption font-semibold w-14 text-right shrink-0 ${strength.text}`}>{strength.label}</span>
    </div>
  );
}

export default PasswordStrength;
