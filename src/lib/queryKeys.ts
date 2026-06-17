/**
 * TanStack Query 키 중앙 관리.
 * 쿼리 키를 컴포넌트/훅에서 하드코딩하지 않고 반드시 이 파일을 통해 참조한다.
 */
export const queryKeys = {
  posts: {
    all: ['posts'] as const,
    detail: (postId: string) => ['posts', postId] as const,
    main: ['posts', 'main'] as const,
    mainFeed: ['posts', 'main', 'feed'] as const,
    exploreBase: ['posts', 'explore'] as const,
    explore: (search?: string, category?: string) => ['posts', 'explore', search, category] as const,
  },
  users: {
    me: ['users', 'me'] as const,
    profile: (userId: string) => ['users', userId, 'profile'] as const,
    followers: (userId: string) => ['users', userId, 'followers'] as const,
    following: (userId: string) => ['users', userId, 'following'] as const,
    search: (query?: string) => ['users', 'search', query] as const,
  },
  bookmarks: ['bookmarks'] as const,
  comments: {
    list: (postId: string) => ['comments', postId] as const,
  },
  notifications: {
    list: ['notifications', 'list'] as const,
  },
  dm: {
    conversations: ['dm', 'conversations'] as const,
    messages: (conversationId: string) => ['dm', 'conversations', conversationId, 'messages'] as const,
  },
}
