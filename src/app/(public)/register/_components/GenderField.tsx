"use client";
import { Segmented, FieldLabel } from "@/components/common";

export type Gender = "male" | "female";

export interface GenderFieldProps {
  value: Gender;
  onChange: (value: Gender) => void;
}

/** 성별 선택 필드 (라벨 + Segmented). */
export function GenderField({ value, onChange }: GenderFieldProps) {
  return (
    <div>
      <FieldLabel>성별</FieldLabel>
      <Segmented
        fullWidth
        size="lg"
        value={value}
        onChange={(key) => onChange(key as Gender)}
        items={[
          { key: "male", label: "남성" },
          { key: "female", label: "여성" },
        ]}
      />
    </div>
  );
}

export default GenderField;
