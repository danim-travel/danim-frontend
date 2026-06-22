import Image from "next/image";
import { AuthCard, AuthFooterLink } from "../_components";
import { RegisterForm } from "./_components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-bg grid grid-cols-3 py-16 px-4">
      <div />
      <div className="flex justify-center items-start">
      <AuthCard size="lg">
        <div className="flex items-center gap-2 mb-5">
          <Image src="/favicon.svg" alt="Danim" width={36} height={36} priority className="w-9 h-9 rounded-lg shadow-md shrink-0" />
          <span className="text-card-title font-bold text-text tracking-tight">danim</span>
        </div>

        <h1 className="text-page-title font-bold text-text tracking-tight">회원가입</h1>
        <p className="text-base text-text-muted mt-2 mb-7">Danim과 함께 국내 여행을 기록해보세요</p>

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
      <div />
    </div>
  );
}
