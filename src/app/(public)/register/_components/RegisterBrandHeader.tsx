/** 회원가입 카드 상단의 브랜드 로고 + 이름 (✈️ danim). */
export function RegisterBrandHeader() {
  return (
    <div className="flex items-center gap-2 mb-5">
      <div className="w-9 h-9 rounded-sm bg-primary-hover flex items-center justify-center shadow-brand shrink-0">
        <span className="text-white text-base">✈️</span>
      </div>
      <span className="text-card-title font-bold text-text tracking-tight">danim</span>
    </div>
  );
}

export default RegisterBrandHeader;
