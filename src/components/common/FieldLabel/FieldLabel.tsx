import type { LabelHTMLAttributes } from "react";

export interface FieldLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function FieldLabel({
  children,
  required,
  className,
  ...props
}: FieldLabelProps) {
  return (
    <label
      className={`block mb-2 text-label font-semibold text-text-secondary ${className ?? ""}`}
      {...props}
    >
      {children}
      {required && <span className="text-primary"> *</span>}
    </label>
  );
}

export default FieldLabel;
