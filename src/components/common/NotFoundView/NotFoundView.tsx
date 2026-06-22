import Image from "next/image";
import Link from "next/link";

interface Props {
  title: string;
  description?: string;
}

export function NotFoundView({ title, description }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 bg-bg">
      <div className="flex flex-col items-center gap-4 text-center">
        <Image src="/logo.svg" alt="Danim" width={64} height={64} priority className="w-16 h-16 rounded-2xl shadow-md" />

        <p className="text-display font-bold text-text-disabled">404</p>

        <div className="flex flex-col gap-1">
          <p className="text-card-title font-semibold text-text">{title}</p>
          {description && <p className="text-body text-text-muted">{description}</p>}
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          href="/explore"
          className="px-5 py-2.5 rounded-pill bg-bg-subtle text-body font-medium text-text hover:bg-border transition-colors"
        >
          탐색하기
        </Link>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-pill bg-primary text-body font-medium text-white hover:opacity-90 transition-opacity"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}

export default NotFoundView;
