"use client";
import { useState } from "react";
import { requestEmailVerify, confirmEmailCode } from "@/lib/api/auth";
import { isApiError } from "@/lib/apiClient";
import { toast } from "@/store/toastStore";

interface UseEmailVerificationOptions {
  onVerified: (emailToken: string) => void;
}

export function useEmailVerification({ onVerified }: UseEmailVerificationOptions) {
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState<string>();

  async function requestVerify(email: string) {
    setRequestLoading(true);
    try {
      await requestEmailVerify(email);
      setCodeSent(true);
      setCode("");
      toast.success("인증코드가 이메일로 발송되었습니다.");
    } catch {
      toast.error("인증코드 발송에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setRequestLoading(false);
    }
  }

  async function confirmCode(email: string) {
    setConfirmError(undefined);
    setConfirmLoading(true);
    try {
      const { email_token } = await confirmEmailCode(email, code);
      setVerified(true);
      onVerified(email_token);
    } catch (e) {
      setConfirmError(isApiError(e) && typeof e.detail === "string" ? e.detail : "코드 확인에 실패했습니다.");
    } finally {
      setConfirmLoading(false);
    }
  }

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
