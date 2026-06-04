import { AuthCard, AuthFooterLink } from "../_components";
import { RegisterBrandHeader, RegisterHeading, RegisterForm } from "./_components";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-bg flex items-start justify-center p-6 py-16">
      <AuthCard size="lg">
        <RegisterBrandHeader />
        <RegisterHeading />
        <RegisterForm />
        <AuthFooterLink
          message="이미 계정이 있으신가요?"
          href="/login"
          linkLabel="로그인"
          className="mt-5"
          linkClassName="font-semibold text-primary-active"
        />
      </AuthCard>
    </div>
  );
}
