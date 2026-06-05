import Link from "next/link";
import { cn } from "@/lib/utils";

export interface AuthFooterLinkProps {
  /** 안내 문구 (예: "계정이 없으신가요?") */
  message: string;
  href: string;
  /** 링크 텍스트 (예: "회원가입") */
  linkLabel: string;
  /** <p> 보정용 (크기·여백) */
  className?: string;
  /** 링크 보정용 (굵기·색) */
  linkClassName?: string;
}

/** 인증 카드 하단의 "…? + 전환 링크" 한 줄. */
export function AuthFooterLink({ message, href, linkLabel, className, linkClassName }: AuthFooterLinkProps) {
  return (
    <p className={cn("text-center text-body-sm text-text-muted", className)}>
      {message}{" "}
      <Link href={href} className={cn("font-bold text-primary-hover hover:underline", linkClassName)}>
        {linkLabel}
      </Link>
    </p>
  );
}

export default AuthFooterLink;
