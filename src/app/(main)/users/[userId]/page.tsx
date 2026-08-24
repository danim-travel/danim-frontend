"use client";
import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthStore } from "@/store/authStore";
import { PageContainer, EmptyState } from "@/components/common";
import { Spinner } from "@/components/ui/spinner";
import { setModalThumbnail } from "@/components/PostModal/_lib/routing/modalThumbnailHandoff";
import type { UserProfileResponse } from "@/types";
import UserProfileHeader from "./_components/UserProfileHeader";
import PostGrid from "../../mypage/_components/PostGrid";

export default function UserPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const myUserId = useAuthStore((s) => s.user?.userId);

  const isOwnProfile = !!myUserId && myUserId === userId;

  useEffect(() => {
    if (isOwnProfile) {
      router.replace("/mypage");
    }
  }, [isOwnProfile, router]);

  const { data: profile, isLoading } = useQuery({
    queryKey: queryKeys.users.profile(userId),
    queryFn: () => apiClient.get(`users/${userId}/profile`).json<UserProfileResponse>(),
    refetchOnWindowFocus: false,
    enabled: !isOwnProfile,
  });

  useEffect(() => {
    if (!profile) return;
    const targetId = sessionStorage.getItem("scrollToPostId");
    if (!targetId) return;
    sessionStorage.removeItem("scrollToPostId");
    requestAnimationFrame(() => {
      document.querySelector(`[data-post-id="${targetId}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [profile]);

  // PostGrid는 alt 필드를 읽는데 UserProfilePost에는 title만 있다.
  // 매핑하지 않으면 썸네일이 전부 alt=""(장식 이미지)로 렌더된다. 마이페이지와 동일한 처리.
  const gridPosts = useMemo(
    () => (profile?.posts ?? []).map((p) => ({ ...p, alt: p.title })),
    [profile?.posts],
  );

  if (isOwnProfile) return null;

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  if (!profile) {
    return (
      <PageContainer>
        <EmptyState title="존재하지 않는 유저입니다." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <h1 className="text-section-title font-bold text-text mb-6">{profile.nickname}님의 프로필</h1>

      <UserProfileHeader key={userId} profile={profile} userId={userId} />

      <div className="mt-6">
        <PostGrid
          posts={gridPosts}
          onPostClick={(id) => {
            const post = profile.posts.find((p) => p.post_id === id);
            if (post?.thumbnail) setModalThumbnail(id, post.thumbnail);
            router.push(`/posts/${id}`);
          }}
        />
      </div>
    </PageContainer>
  );
}
