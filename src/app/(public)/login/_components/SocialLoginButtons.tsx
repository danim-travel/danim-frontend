import { Button } from "@/components/common";

/**
 * TODO: 소셜 로그인 API 연동 시 onClick 핸들러 추가
 */
export function SocialLoginButtons() {
  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="secondary"
        fullWidth
        className="h-[52px] text-base font-bold bg-social-kakao-bg text-social-kakao-text border-none shadow-none hover:opacity-90"
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
