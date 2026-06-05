"use client";

import { createContext, useContext } from "react";
import type { useCommentMutations } from "@/hooks/useCommentMutations";
import type { usePostDetail } from "@/hooks/usePostDetail";

type CommentsApi = ReturnType<typeof useCommentMutations>;
type PostDetailApi = ReturnType<typeof usePostDetail>;

// 보관함 안에 담기는 데이터의 타입. `postId`, `currentUserId`, 좋아요/북마크/댓글 관련 mutation들
interface PostModalContextValue {
  postId: string;
  currentUserId: string | null;
  postLikeMutation: PostDetailApi["likeMutation"];
  postBookmarkMutation: PostDetailApi["bookmarkMutation"];
  createComment: CommentsApi["createMutation"];
  // updateComment·deleteComment는 CommentSection이 mutate 함수만 필요하므로 콜백으로 노출
  onUpdateComment: (commentId: string, content: string) => void;
  onDeleteComment: (commentId: string) => void;
  toggleCommentLike: CommentsApi["toggleCommentLike"];
}

// 실제 보관함(Context 객체). 초기값은 null
const PostModalContext = createContext<PostModalContextValue | null>(null);

// 보관함을 자식들에게 제공하는 컴포넌트
export const PostModalProvider = PostModalContext.Provider;

// 보관함에서 데이터를 꺼내는 함수
export function usePostModalContext(): PostModalContextValue {
  const ctx = useContext(PostModalContext);
  if (!ctx) {
    throw new Error("usePostModalContext must be used within PostModalProvider");
  }
  return ctx;
}
