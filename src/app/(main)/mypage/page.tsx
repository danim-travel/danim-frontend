"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { AnimatePresence } from "motion/react";
import { LayoutGrid, Bookmark } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { Tabs, PageContainer } from "@/components/common";
import { Spinner } from "@/components/ui/spinner";
import PostModal from "@/components/PostModal";
import { useMyProfile } from "./_hooks/useMyProfile";
import { useBookmarksQuery } from "./_hooks/useBookmarksQuery";
import ProfileHeader from "./_components/ProfileHeader";
import PostGrid, { type PostGridItem } from "./_components/PostGrid";
import BookmarksTabPanel from "./_components/BookmarksTabPanel";
import { useAuthHydrationFallback } from "@/hooks/useAuthHydrationFallback";

type MyPageTab = "posts" | "bookmarks";

function MyPageContent({ userId }: { userId: string }) {
  const router = useRouter();
  const closePanel = useUIStore((s) => s.closePanel);
  const { data: profile, isLoading } = useMyProfile(userId);
  const [tab, setTab] = useState<MyPageTab>("posts");
  const [modalPostId, setModalPostId] = useQueryState("post", parseAsString);

  // 마이페이지 진입 시 즉시 북마크를 fetch — 탭 카운트가 처음부터 정확히 보이도록.
  // 탭 클릭 시점에 처음 fetch하면 카운트가 0으로 잠깐 보이는 문제가 있음.
  const {
    data: bookmarksData,
    isLoading: isBookmarksLoading,
    isError: isBookmarksError,
    error: bookmarksError,
    hasNextPage: hasMoreBookmarks,
    isFetchingNextPage: isFetchingMoreBookmarks,
    fetchNextPage: fetchMoreBookmarks,
  } = useBookmarksQuery();

  const bookmarksItems: PostGridItem[] = useMemo(() => {
    if (!bookmarksData) return [];
    return bookmarksData.pages.flatMap((page) =>
      page.results.map((item) => ({
        post_id: item.post_id,
        thumbnail: item.thumbnail,
        alt: item.description ?? "",
        like_count: item.like_count,
        comment_count: item.comment_count,
      })),
    );
  }, [bookmarksData]);

  const postsItems = useMemo(
    () =>
      (profile?.posts ?? []).map((p) => ({
        post_id: p.post_id,
        thumbnail: p.thumbnail,
        alt: p.title,
      })),
    [profile?.posts],
  );

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
        <div className="md:hidden">
          <Tabs
            items={[
              { key: "posts", label: "게시글", count: profile.posts_count ?? 0, icon: <LayoutGrid size={16} /> },
              { key: "bookmarks", label: "저장됨", count: bookmarksItems.length, icon: <Bookmark size={16} /> },
            ]}
            value={tab}
            onChange={(key) => setTab(key as MyPageTab)}
            fullWidth
          />
        </div>
        <div className="hidden md:block">
          <Tabs
            items={[
              { key: "posts", label: "게시글", count: profile.posts_count ?? 0, icon: <LayoutGrid size={16} /> },
              { key: "bookmarks", label: "저장됨", count: bookmarksItems.length, icon: <Bookmark size={16} /> },
            ]}
            value={tab}
            onChange={(key) => setTab(key as MyPageTab)}
          />
        </div>
      </div>
      <div className="mt-6">
        {tab === "posts" ? (
          <PostGrid
            posts={postsItems}
            isLoading={isLoading}
            onPostClick={(id) => { closePanel(); void setModalPostId(id); }}
          />
        ) : (
          <BookmarksTabPanel
            items={bookmarksItems}
            isLoading={isBookmarksLoading}
            isError={isBookmarksError}
            error={bookmarksError}
            hasNextPage={!!hasMoreBookmarks}
            isFetchingNextPage={isFetchingMoreBookmarks}
            onLoadMore={() => fetchMoreBookmarks()}
            onPostClick={(id) => { closePanel(); void setModalPostId(id); }}
          />
        )}
      </div>
      <AnimatePresence>
        {modalPostId && (
          <PostModal
            postId={modalPostId}
            onClose={() => void setModalPostId(null)}
            showGoToMain
            onGoToMain={() => {
              sessionStorage.setItem("scrollToPostId", modalPostId!);
              void setModalPostId(null);
              router.push(`/?solo=${modalPostId}`);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function MyPageContainer() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.user?.userId);
  // accessToken은 있는데 userId가 없는 gap을 getCurrentUser로 복구 (새로고침/설정 저장 직후 등)
  const { authFallbackMessage } = useAuthHydrationFallback();

  // silent refresh 진행 중에는 스피너 — AuthBootstrap 완료 전 라우팅 판단 방지
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  // accessToken은 있는데 userId가 없는 짧은 gap — useAuthHydrationFallback이 getCurrentUser로 복구 중
  if (accessToken && !userId) {
    return (
      <div className="flex items-center justify-center py-20">
        {authFallbackMessage ? (
          <p className="text-text-muted">{authFallbackMessage}</p>
        ) : (
          <Spinner size="lg" />
        )}
      </div>
    );
  }

  if (!accessToken || !userId) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-text-muted">로그인이 필요합니다.</p>
      </div>
    );
  }

  return <MyPageContent userId={userId} />;
}

export default function MyPage() {
  return (
    <PageContainer>
      <h1 className="text-section-title font-bold text-text mb-6">내 프로필</h1>
      <MyPageContainer />
    </PageContainer>
  );
}
