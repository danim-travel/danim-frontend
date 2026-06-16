import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import { SocialCallbackHandler } from "./_components/SocialCallbackHandler";

export default function SocialCallbackPage() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Suspense fallback={<Spinner size="lg" />}>
        <SocialCallbackHandler />
      </Suspense>
    </div>
  );
}
