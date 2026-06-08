import { AuthSplitLayout, AuthCard, AuthCardHeader, AuthFooterLink } from "../_components";
import { LoginForm } from "./_components/LoginForm";

export default function LoginPage() {
  return (
    <AuthSplitLayout>
      <AuthCard>
        <AuthCardHeader title="로그인" subtitle="Danim에 오신 것을 환영합니다" />
        <LoginForm />
        <AuthFooterLink message="계정이 없으신가요?" href="/register" linkLabel="회원가입" />
      </AuthCard>
    </AuthSplitLayout>
  );
}
