import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { publicClient } from "@/lib/apiClient";
import { isApiError, getApiErrorMessage } from "@/lib/apiError";
import { config } from "@/lib/config";
import type { PostDetail } from "@/types";
import { NotFoundView } from "@/components/common";
import PostPublicPage from "./_components/PostPublicPage";

// ISR: 60초마다 백엔드 재검증. 봇 폭주 시 백엔드 직격 방지.
export const revalidate = 60;

interface Props {
  params: Promise<{ postId: string }>;
}

// generateMetadata·페이지 컴포넌트가 같은 요청 내에서 한 번만 fetch하도록 dedup.
const getPostDetail = cache(async (postId: string): Promise<PostDetail> => {
  return publicClient.get(`posts/${postId}`).json<PostDetail>();
});

const FALLBACK_METADATA: Metadata = {
  title: "Danim · 여행자들의 이야기",
  description: "여행의 모든 순간을 기록하세요",
  // 삭제·장애 페이지가 검색엔진에 색인되지 않도록 차단한다.
  robots: { index: false, follow: false },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { postId } = await params;
  try {
    const post = await getPostDetail(postId);
    const title = post.post.title?.trim()
      ? `${post.post.title} — Danim`
      : `${post.user.nickname}의 여행 기록 — Danim`;
    const description = post.post.description || `${post.user.nickname}의 여행 이야기`;
    const url = `${config.siteUrl}/posts/${postId}`;
    const images = post.post.thumbnail
      ? [{ url: post.post.thumbnail, width: 1200, height: 630, alt: title }]
      : [];

    return {
      title,
      description,
      alternates: { canonical: url },
      robots: { index: true, follow: true },
      openGraph: {
        type: "article",
        title,
        description,
        images,
        url,
        siteName: "Danim",
        publishedTime: post.post.created_at,
        authors: [post.user.nickname],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: post.post.thumbnail ? [post.post.thumbnail] : [],
      },
    };
  } catch {
    return FALLBACK_METADATA;
  }
}

export default async function PostPublicRoute({ params }: Props) {
  const { postId } = await params;
  // 렌더링 단계와 데이터 로딩 단계를 분리 — try/catch 안에서 JSX를 만들면
  // 렌더 시점의 에러는 잡히지 않고 ESLint react-hooks/error-boundaries 규칙에도 어긋난다.
  let initialData: PostDetail | null = null;
  let notFoundMessage: string | null = null;

  let notFoundDescription = "삭제되었거나 존재하지 않는 게시글입니다.";

  try {
    initialData = await getPostDetail(postId);
  } catch (err) {
    if (isApiError(err) && err.status === 404) {
      notFoundMessage = getApiErrorMessage(err, { client: "게시글을 찾을 수 없습니다." });
    } else if (isApiError(err) && (err.status === 401 || err.status === 403)) {
      // selective auth 미구현 시 publicClient 호출이 401/403으로 떨어지는 케이스도 같이 흡수
      notFoundMessage = "접근할 수 없는 게시글입니다.";
      notFoundDescription = "비공개 게시글이거나 권한이 없습니다.";
    } else {
      notFound();
    }
  }

  if (notFoundMessage) {
    return <NotFoundView title={notFoundMessage} description={notFoundDescription} />;
  }
  return <PostPublicPage postId={postId} initialData={initialData!} />;
}
