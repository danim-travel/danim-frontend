"use client";
import { useState } from "react";
import { LayoutGrid, Bookmark } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Tabs, EmptyState, PageContainer } from "@/components/common";
import { Spinner } from "@/components/ui/spinner";
import PostModal from "@/components/PostModal";
import { useMyProfile } from "./_hooks/useMyProfile";
import ProfileHeader from "./_components/ProfileHeader";
import PostGrid from "./_components/PostGrid";

type MyPageTab = "posts" | "bookmarks";

function MyPageContent({ userId }: { userId: string }) {
  const { data: profile, isLoading } = useMyProfile(userId);
  const [tab, setTab] = useState<MyPageTab>("posts");
  const [modalPostId, setModalPostId] = useState<string | null>(null);

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
          <PostGrid posts={profile.posts} onPostClick={setModalPostId} />
        ) : (
          <EmptyState
            title="준비 중입니다"
            description="저장된 게시글 기능은 곧 제공될 예정이에요."
          />
        )}
      </div>
      {modalPostId && (
        <PostModal postId={modalPostId} onClose={() => setModalPostId(null)} />
      )}
    </>
  );
}

export default function MyPage() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const userId = useAuthStore((s) => s.user?.userId);

  return (
    <PageContainer>
      <h1 className="text-section-title font-bold text-text mb-6">내 프로필</h1>

      {!isHydrated ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : !userId ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-text-muted">로그인이 필요합니다.</p>
        </div>
      ) : (
        <MyPageContent userId={userId} />
      )}
    </PageContainer>
  );
}
