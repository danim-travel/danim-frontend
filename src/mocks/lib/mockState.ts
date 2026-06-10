import { ALL_FEED_ITEMS } from '../handlers/mainFeed'

export const likedPosts = new Set<string>(
  ALL_FEED_ITEMS.filter((f) => f.is_liked).map((f) => f.post.post_id)
)
export const likedComments = new Set<string>(['comment-2'])
export const bookmarkedPosts = new Set<string>(
  ALL_FEED_ITEMS.filter((f) => f.is_bookmarked).map((f) => f.post.post_id)
)

export const postLikeCounts = new Map<string, number>([
  ['showcase-post', 24],
  ...ALL_FEED_ITEMS.map((f) => [f.post.post_id, f.like_count] as [string, number]),
])
export const postBookmarkCounts = new Map<string, number>([
  ['showcase-post', 8],
])
export const commentLikeCounts = new Map<string, number>([
  ['comment-1', 2],
  ['comment-2', 5],
  ['comment-3', 0],
])
