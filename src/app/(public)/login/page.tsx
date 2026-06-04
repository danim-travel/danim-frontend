import { AuthSplitLayout, AuthCard, AuthCardHeader, AuthFooterLink } from "../_components";
import { SocialLoginButtons, EmailDivider, LoginForm } from "./_components";

export default function LoginPage() {
  return (
    <AuthSplitLayout>
      <AuthCard>
        <AuthCardHeader title="로그인" subtitle="Danim에 오신 것을 환영합니다" />
        <SocialLoginButtons />
        <EmailDivider />
        <LoginForm />
        <AuthFooterLink message="계정이 없으신가요?" href="/register" linkLabel="회원가입" />
      </AuthCard>
    </AuthSplitLayout>
  );
}
