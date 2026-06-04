"use client";
import { useState } from "react";
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
          className="text-caption font-bold text-primary hover:text-primary-active transition-colors bg-transparent border-none cursor-pointer whitespace-nowrap"
        >
          {show ? "숨기기" : "보기"}
        </button>
      }
    />
  );
}

export default PasswordField;
