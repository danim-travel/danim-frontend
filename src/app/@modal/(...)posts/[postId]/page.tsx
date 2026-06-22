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

  // @modal 슬롯을 history pop으로 닫은 뒤 다음 경로로 이동.
  // router.replace/push 단독으로는 같은 layout 내에서 슬롯이 유지되는 케이스가 있어
  // popstate 완료 시점에 push 한다.
  // 다른 원인(BottomSheet/Drawer 닫기, 브라우저 뒤로가기)의 popstate를 가로채지 않도록
  // history.state에 marker를 심어 우리가 발생시킨 back()만 식별한다.
  const backThenPush = (nextPath: string) => {
    const marker = `nav-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const prevState = (window.history.state ?? {}) as Record<string, unknown>;
    window.history.replaceState({ ...prevState, __navMarker: marker }, "");
    const onPop = () => {
      const currentState = window.history.state as { __navMarker?: string } | null;
      if (currentState?.__navMarker === marker) return; // 다른 원인의 popstate — 무시
      window.removeEventListener("popstate", onPop);
      clearTimeout(timeoutId);
      router.push(nextPath);
    };
    window.addEventListener("popstate", onPop);
    const timeoutId = setTimeout(() => window.removeEventListener("popstate", onPop), 2000);
    router.back();
  };

  return (
    <PostModal
      postId={postId}
      placeholderThumbnail={placeholderThumbnail}
      onClose={() => router.back()}
      showGoToMain
      onGoToMain={() => {
        try { sessionStorage.setItem("scrollToPostId", postId); } catch {}
        backThenPush(`/?solo=${postId}`);
      }}
      onEdit={() => backThenPush(`/write/${postId}/edit`)}
      onNavigate={backThenPush}
    />
  );
}
