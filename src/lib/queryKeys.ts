/**
 * TanStack Query 키 중앙 관리.
 * 쿼리 키를 컴포넌트/훅에서 하드코딩하지 않고 반드시 이 파일을 통해 참조한다.
 */
export const queryKeys = {
  posts: {
    all: ['posts'] as const,
    detail: (postId: string) => ['posts', postId] as const,
    main: ['posts', 'main'] as const,
    explore: (search?: string) => ['posts', 'explore', search] as const,
  },
  users: {
    profile: (userId: number | string) => ['users', userId, 'profile'] as const,
    followers: (userId: number | string) => ['users', userId, 'followers'] as const,
    following: (userId: number | string) => ['users', userId, 'following'] as const,
  },
  bookmarks: ['bookmarks'] as const,
  comments: {
    list: (postId: string) => ['comments', postId] as const,
  },
}
