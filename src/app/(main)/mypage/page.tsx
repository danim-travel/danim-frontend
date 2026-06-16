"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { LayoutGrid, Bookmark } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { Tabs, EmptyState, PageContainer } from "@/components/common";
import { Spinner } from "@/components/ui/spinner";
import PostModal from "@/components/PostModal";
import { useMyProfile } from "./_hooks/useMyProfile";
import ProfileHeader from "./_components/ProfileHeader";
import PostGrid from "./_components/PostGrid";
import { useAuthHydrationFallback } from "@/hooks/useAuthHydrationFallback";

type MyPageTab = "posts" | "bookmarks";

function MyPageContent({ userId }: { userId: string }) {
  const router = useRouter();
  const { closePanel } = useUIStore();
  const { data: profile, isLoading } = useMyProfile(userId);
  const [tab, setTab] = useState<MyPageTab>("posts");
  const [modalPostId, setModalPostId] = useState<string | null>(null);

  // solo 모드에서 돌아왔을 때 해당 게시글로 스크롤 복원
  useEffect(() => {
    if (!profile) return;
    const targetId = sessionStorage.getItem("scrollToPostId");
    if (!targetId) return;
    sessionStorage.removeItem("scrollToPostId");
    requestAnimationFrame(() => {
      document.querySelector(`[data-post-id="${targetId}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [profile]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-text-muted">프로필을 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      <ProfileHeader profile={profile} />
      <div className="mt-6">
        <Tabs
          items={[
            { key: "posts", label: "게시글", count: profile.posts_count ?? 0, icon: <LayoutGrid size={16} /> },
            { key: "bookmarks", label: "저장됨", count: 0, icon: <Bookmark size={16} /> },
          ]}
          value={tab}
          onChange={(key) => setTab(key as MyPageTab)}
        />
      </div>
      <div className="mt-6">
        {tab === "posts" ? (
          <PostGrid posts={profile.posts} onPostClick={(id) => { closePanel(); setModalPostId(id); }} />
        ) : (
          <EmptyState
            title="준비 중입니다"
            description="저장된 게시글 기능은 곧 제공될 예정이에요."
          />
        )}
      </div>
      <AnimatePresence>
        {modalPostId && (
          <PostModal
            postId={modalPostId}
            onClose={() => setModalPostId(null)}
            showGoToMain
            onGoToMain={() => {
              sessionStorage.setItem("scrollToPostId", modalPostId);
              router.push(`/?solo=${modalPostId}`);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default function MyPage() {
  const userId = useAuthStore((s) => s.user?.userId);
  const accessToken = useAuthStore((s) => s.accessToken);
  const { authFallbackMessage } = useAuthHydrationFallback();

  // AuthBootstrap이 isHydrated=true가 될 때까지 전역 스피너로 렌더링을 차단함
  // AuthGuard는 accessToken이 없으면 null 반환 후 /login으로 리다이렉트함
  // 새로고침 직후 accessToken은 있지만 userId가 아직 null인 타이밍을 여기서 처리
  if (!userId) {
    // accessToken도 없으면 AuthGuard가 처리 — 여기선 그냥 null 반환
    if (!accessToken) return null;

    return (
      <PageContainer>
        <div className="flex items-center justify-center py-20">
          {authFallbackMessage ? (
            <p className="text-text-muted">{authFallbackMessage}</p>
          ) : (
            <Spinner size="lg" />
          )}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <h1 className="text-section-title font-bold text-text mb-6">내 프로필</h1>
      <MyPageContent userId={userId} />
    </PageContainer>
  );
}
