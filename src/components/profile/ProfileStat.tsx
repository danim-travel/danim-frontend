import Link from "next/link";
import { formatCount } from "@/lib/formatCount";

export type ProfileStatVariant = "inline" | "divider";

interface ProfileStatProps {
  label: string;
  value: number;
  href?: string;
  /** inline: 모바일 divide-x 인라인 / divider: 데스크톱 대형 숫자 */
  variant?: ProfileStatVariant;
}

export function ProfileStat({ label, value, href, variant = "inline" }: ProfileStatProps) {
  const isDivider = variant === "divider";
  const base = isDivider
    ? "flex flex-col items-center px-6"
    : "flex flex-1 flex-col items-center px-3";
  const valueCls = `${isDivider ? "text-section-title" : "text-card-title"} font-bold text-text leading-none`;
  const labelCls = `${isDivider ? "text-body-sm mt-1.5" : "text-nav mt-1"} text-text-muted`;

  const content = (
    <>
      <span className={valueCls}>{formatCount(value)}</span>
      <span className={labelCls}>{label}</span>
    </>
  );

  if (href) {
    const hover = isDivider ? "hover:opacity-75 transition-opacity" : "hover:bg-bg-subtle rounded-lg transition-colors";
    return (
      <Link href={href} className={`${base} ${hover}`}>
        {content}
      </Link>
    );
  }
  return <div className={base}>{content}</div>;
}
