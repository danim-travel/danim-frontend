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
    <div className="min-h-screen bg-bg-light flex flex-col">
      <AuthRedirect postId={postId} />

      <header className="w-full px-4 sm:px-6 py-4 border-b border-border-subtle bg-bg-card">
        <Link href="/" className="inline-flex items-center gap-2">
          <Image src="/favicon.svg" alt="Danim" width={28} height={28} priority />
          <span className="text-base font-bold text-text">Danim</span>
        </Link>
      </header>

      <main className="flex-1 flex items-start justify-center p-4 sm:p-6 md:p-10">
        <GuestPostView data={initialData} />
      </main>
    </div>
  );
}
