import { Suspense } from "react";
import { SocialCallbackHandler } from "./_components/SocialCallbackHandler";

export default function SocialCallbackPage() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Suspense
        fallback={
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        }
      >
        <SocialCallbackHandler />
      </Suspense>
    </div>
  );
}
