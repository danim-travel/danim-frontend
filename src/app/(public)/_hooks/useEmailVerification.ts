"use client";
import { useState } from "react";
import { requestEmailVerify, confirmEmailCode } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/apiError";
import { toast } from "@/store/toastStore";

interface UseEmailVerificationOptions {
  // 인증 완료 시 백엔드가 발급한 email_token을 폼에 주입하기 위한 콜백
  onVerified: (emailToken: string) => void;
  // 회원가입('signup') / 비밀번호 재설정('find_password') 양쪽에서 재사용
  purpose: 'signup' | 'find_password';
}

export function useEmailVerification({ onVerified, purpose }: UseEmailVerificationOptions) {
  const [code, setCode] = useState("");           // 사용자가 입력한 인증 코드
  const [codeSent, setCodeSent] = useState(false); // 코드 발송 완료 여부 → 인증 코드 필드 활성화 조건
  const [verified, setVerified] = useState(false); // 인증 완료 여부 → 이메일 필드 잠금 조건
  const [requestLoading, setRequestLoading] = useState(false); // "인증 요청" 버튼 로딩
  const [confirmLoading, setConfirmLoading] = useState(false);  // "확인" 버튼 로딩
  const [confirmError, setConfirmError] = useState<string>();   // 코드 확인 API 실패 메시지

  // "인증 요청" / "재요청" 버튼 클릭 → 이메일로 인증 코드 발송
  async function requestVerify(email: string) {
    setRequestLoading(true);
    try {
      await requestEmailVerify(email, purpose);
      setCodeSent(true);
      setCode("");
      toast.success("인증코드가 이메일로 발송되었습니다.");
    } catch (e) {
      toast.error(getApiErrorMessage(e, { client: "인증코드 발송에 실패했습니다. 입력값을 확인해주세요." }));
    } finally {
      setRequestLoading(false);
    }
  }

  // "확인" 버튼 클릭 → 입력한 코드 검증 → 성공 시 email_token 발급
  async function confirmCode(email: string) {
    setConfirmError(undefined);
    if (!code.trim()) {
      setConfirmError("인증코드를 입력해주세요.");
      return;
    }
    if (code.length < 6) {
      setConfirmError("인증코드 6자리를 입력해주세요.");
      return;
    }
    setConfirmLoading(true);
    try {
      const { email_token } = await confirmEmailCode(email, code, purpose);
      setVerified(true);
      onVerified(email_token); // 발급된 토큰을 폼의 emailToken 필드에 주입
    } catch (e) {
      setConfirmError(getApiErrorMessage(e, { client: "인증코드가 올바르지 않습니다." }));
    } finally {
      setConfirmLoading(false);
    }
  }

  // 이메일 변경 시 인증 상태 전체 초기화
  function resetVerification() {
    setCodeSent(false);
    setCode("");
    setConfirmError(undefined);
  }

  return {
    code,
    setCode,
    codeSent,
    verified,
    requestLoading,
    confirmLoading,
    confirmError,
    requestVerify,
    confirmCode,
    resetVerification,
  };
}
