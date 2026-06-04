import { AuthSplitLayout, AuthCard, AuthCardHeader } from "../_components";
import { BackLink, ResetPasswordForm } from "./_components";

export default function ResetPasswordPage() {
  return (
    <AuthSplitLayout>
      <AuthCard>
        {/* 헤더 */}
        <div className="flex flex-col gap-3">
          <BackLink />
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
