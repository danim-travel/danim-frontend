import React from "react";

export interface FieldLabelProps {
  children: React.ReactNode;
  /** 필수 표시(*) 노출 여부 */
  required?: boolean;
}

/** 폼 필드 라벨. 입력류 컴포넌트(TextField·VerificationField 등)와 그룹 필드가 공유한다. */
export function FieldLabel({ children, required }: FieldLabelProps) {
  return (
    <span className="block mb-2 text-label font-semibold text-text-secondary">
      {children}
      {required && <span className="text-primary"> *</span>}
    </span>
  );
}

export default FieldLabel;
