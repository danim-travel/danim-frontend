"use client";
import { useState } from "react";
import { checkNickname } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/apiError";
import { NICKNAME_RULES } from "../_constants/nicknameValidation";

interface NicknameCheckResult {
  ok: boolean;
  message: string;
}

export function useNicknameCheck() {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<NicknameCheckResult | null>(null);

  // "중복 확인" 버튼 클릭 → API 호출 → result에 성공/실패 메시지 저장
  async function checkDuplicate(nickname: string) {
    setChecking(true);
    try {
      const { detail } = await checkNickname(nickname);
      setResult({ ok: true, message: detail });
    } catch (e) {
      setResult({
        ok: false,
        message: getApiErrorMessage(e, { client: "중복된 닉네임입니다." }),
      });
    } finally {
      setChecking(false);
    }
  }

  // 닉네임 입력값이 바뀌면 이전 중복 확인 결과를 지움
  function reset() {
    setResult(null);
  }

  // 최소 글자 수 이상일 때만 "중복 확인" 버튼 활성화
  const canCheck = (nickname: string) => nickname.length >= NICKNAME_RULES.minLength;

  return { checking, result, checkDuplicate, reset, canCheck };
}
