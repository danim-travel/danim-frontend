/** "또는 이메일로 로그인" 구분선. */
export function EmailDivider() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex-1 h-px bg-border" />
      <span className="text-caption text-text-muted whitespace-nowrap">또는 이메일로 로그인</span>
      <span className="flex-1 h-px bg-border" />
    </div>
  );
}

export default EmailDivider;
