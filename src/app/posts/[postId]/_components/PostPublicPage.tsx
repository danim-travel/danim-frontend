import Image from "next/image";
import Link from "next/link";
import type { PostDetail } from "@/types";
import AuthRedirect from "./AuthRedirect";
import GuestPostView from "./GuestPostView";

interface Props {
  postId: string;
  initialData: PostDetail;
}

export default function PostPublicPage({ postId, initialData }: Props) {
  return (
    <AuthRedirect postId={postId}>
      <div className="min-h-screen bg-bg-light flex flex-col">
        <header className="w-full px-4 sm:px-6 py-4 border-b border-border-subtle bg-bg-card flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src="/logo.svg" alt="Danim" width={28} height={28} priority />
            <span className="text-base font-bold text-text">Danim</span>
          </Link>
          {/* C4: 인터셉트가 아닌 풀페이지 진입 시에도 닫기/홈/탐색 동선 제공 */}
          <nav className="flex items-center gap-3 text-body-sm">
            <Link href="/explore" className="text-text-muted hover:text-text transition-colors">탐색</Link>
            <Link href="/" className="px-3 py-1.5 rounded-pill bg-primary text-white font-medium hover:opacity-90 transition-opacity">홈으로</Link>
          </nav>
        </header>

        <main className="flex-1 flex items-start justify-center p-4 sm:p-6 md:p-10">
          <GuestPostView data={initialData} />
        </main>
      </div>
    </AuthRedirect>
  );
}
