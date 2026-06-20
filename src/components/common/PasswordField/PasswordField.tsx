"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { TextField, type TextFieldProps } from "../TextField/TextField";

/** 보기/숨기기 토글이 내장된 비밀번호 입력 필드. TextField를 감싸 rightSlot으로 토글을 제공한다. */
export type PasswordFieldProps = Omit<TextFieldProps, "type" | "rightSlot">;

export function PasswordField(props: PasswordFieldProps) {
  const [show, setShow] = useState(false);

  return (
    <TextField
      {...props}
      type={show ? "text" : "password"}
      rightSlot={
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "비밀번호 숨기기" : "비밀번호 보기"}
          className="text-text-muted hover:text-text transition-colors cursor-pointer"
        >
          {show ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
        </button>
      }
    />
  );
}

export default PasswordField;
