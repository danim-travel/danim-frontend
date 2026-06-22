"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function AuthRedirect({ postId }: { postId: string }) {
  const isLoggedIn = useAuthStore((s) => !!s.accessToken);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && isLoggedIn) {
      router.replace(`/?post=${postId}`);
    }
  }, [isHydrated, isLoggedIn, postId, router]);

  return null;
}
