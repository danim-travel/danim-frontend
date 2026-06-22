"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import PostModal from "@/components/PostModal";
import { consumeModalThumbnail } from "@/components/PostModal/_lib/routing/modalThumbnailHandoff";

interface Props {
  params: Promise<{ postId: string }>;
}

/**
 * Intercepting + Parallel Route 진입점.
 * 앱 내 클라이언트 네비게이션(`router.push('/posts/[id]')`)에서만 트리거되며,
 * 새로고침/공유 링크 진입은 `src/app/posts/[postId]/page.tsx` (full page)가 처리한다.
 *
 * 모달 닫기 / 메인 이동 모두 `router.back()`을 우선 사용한다.
 *   - 인터셉트 슬롯은 history 뒤로가기를 통해서만 안정적으로 default.tsx(null)로 리셋되며,
 *     `router.replace`로 다른 URL로 전환해도 같은 layout 내에서는 @modal 슬롯이
 *     유지되는 케이스(Next.js 16 동작)가 있다.
 *   - referrer를 알 수 없는 직접 진입은 인터셉트가 발동하지 않으므로 이 컴포넌트가 마운트되지 않는다.
 *     따라서 router.back() 후에는 항상 진입 직전 페이지(explore / mypage / users 등)가 노출된다.
 */
export default function PostModalInterceptor({ params }: Props) {
  const router = useRouter();
  const { postId } = use(params);
  // 클릭 측에서 sessionStorage에 저장한 썸네일을 1회만 꺼내 placeholder로 사용
  const [placeholderThumbnail] = useState(() => consumeModalThumbnail(postId));

  return (
    <PostModal
      postId={postId}
      placeholderThumbnail={placeholderThumbnail}
      onClose={() => router.back()}
      showGoToMain
      onGoToMain={() => {
        try { sessionStorage.setItem("scrollToPostId", postId); } catch {}
        // back()으로 @modal 슬롯을 닫은 뒤 popstate 시점에 메인으로 push.
        // AbortController + 2초 타임아웃으로 리스너 영구 누수 방지.
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        window.addEventListener("popstate", () => {
          clearTimeout(timeout);
          router.push(`/?solo=${postId}`);
        }, { once: true, signal: controller.signal });
        router.back();
      }}
    />
  );
}
