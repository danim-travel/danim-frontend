import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AuthCard, AuthCardHeader, AuthSplitLayout } from "../_components";
import { ResetPasswordForm } from "./_components/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <AuthSplitLayout>
      <AuthCard>
        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="flex items-center gap-1 self-start text-caption text-text-muted hover:text-text-secondary transition-colors"
          >
            <ChevronLeft className="size-3.5" />
            로그인으로 돌아가기
          </Link>
          <AuthCardHeader
            title="비밀번호 재설정"
            subtitle={
              <>
                가입한 이메일로 인증 코드를 보내드려요.
                <br />
                6자리 코드를 입력하고 새 비밀번호를 설정하세요.
              </>
            }
          />
        </div>

        <ResetPasswordForm />
      </AuthCard>
    </AuthSplitLayout>
  );
}
