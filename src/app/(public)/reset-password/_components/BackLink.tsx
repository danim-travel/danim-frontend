import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/** "로그인으로 돌아가기" 뒤로가기 링크. */
export function BackLink() {
  return (
    <Link
      href="/login"
      className="flex items-center gap-1 self-start text-caption text-text-muted hover:text-text-secondary transition-colors"
    >
      <ChevronLeft className="size-3.5" />
      로그인으로 돌아가기
    </Link>
  );
}

export default BackLink;
