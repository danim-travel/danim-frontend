import { Button } from "@/components/common";

/**
 * 카카오/구글 소셜 로그인 버튼.
 * 공식 브랜드 색상(#FEE500 등)은 디자인 토큰 대상이 아니므로 이 컴포넌트 내부에 한정해 사용한다.
 * TODO: 소셜 로그인 API 연동 시 onClick 핸들러 추가
 */
export function SocialLoginButtons() {
  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="secondary"
        fullWidth
        className="h-[52px] text-base font-bold bg-[#FEE500] text-[#191600] border-none shadow-none hover:opacity-90"
      >
        카카오톡으로 계속하기
      </Button>
      <Button
        variant="secondary"
        fullWidth
        className="h-[52px] text-base bg-bg-subtle text-text hover:bg-bg"
      >
        Google로 계속하기
      </Button>
    </div>
  );
}

export default SocialLoginButtons;
