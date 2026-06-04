import { http, HttpResponse } from 'msw'
import type { LikeResponse, BookmarkResponse } from '@/types'

export const likedPosts = new Set<string>()
// comment-2는 초기 상태에서 사용자가 좋아요를 누른 상태
export const likedComments = new Set<string>(['comment-2'])
export const bookmarkedPosts = new Set<string>()

// 게시글/댓글별 좋아요·북마크 카운트(현재 사용자의 like 포함).
export const postLikeCounts = new Map<string, number>([
  ['showcase-post', 24],
])
export const postBookmarkCounts = new Map<string, number>([
  ['showcase-post', 8],
])
export const commentLikeCounts = new Map<string, number>([
  ['comment-1', 2],
  ['comment-2', 5],
  ['comment-3', 0],
])


export const interactionsHandlers = [
  // ── 게시글 좋아요 ───────────────────────────────

  http.post('*/v1/posts/:postId/like', ({ params }) => {
    const postId = params.postId as string
    if (likedPosts.has(postId)) {
      return HttpResponse.json(
        { error_detail: { field_name: ['like'] } },
        { status: 409 }
      )
    }
    likedPosts.add(postId)
    const next = (postLikeCounts.get(postId) ?? 0) + 1
    postLikeCounts.set(postId, next)
    const response: LikeResponse = { is_liked: true, like_count: next }
    return HttpResponse.json(response, { status: 201 })
  }),

  http.delete('*/v1/posts/:postId/like', ({ params }) => {
    const postId = params.postId as string
    const wasLiked = likedPosts.delete(postId)
    const current = postLikeCounts.get(postId) ?? 0
    const next = wasLiked ? Math.max(0, current - 1) : current
    postLikeCounts.set(postId, next)
    const response: LikeResponse = { is_liked: false, like_count: next }
    return HttpResponse.json(response)
  }),

  // ── 댓글 좋아요 ────────────────────────────────

  http.post('*/v1/comments/:commentId/like', ({ params }) => {
    const commentId = params.commentId as string
    if (likedComments.has(commentId)) {
      return HttpResponse.json(
        { error_detail: { field_name: ['like'] } },
        { status: 409 }
      )
    }
    likedComments.add(commentId)
    const next = (commentLikeCounts.get(commentId) ?? 0) + 1
    commentLikeCounts.set(commentId, next)
    const response: LikeResponse = { is_liked: true, like_count: next }
    return HttpResponse.json(response, { status: 201 })
  }),

  http.delete('*/v1/comments/:commentId/like', ({ params }) => {
    const commentId = params.commentId as string
    const wasLiked = likedComments.delete(commentId)
    const current = commentLikeCounts.get(commentId) ?? 0
    const next = wasLiked ? Math.max(0, current - 1) : current
    commentLikeCounts.set(commentId, next)
    const response: LikeResponse = { is_liked: false, like_count: next }
    return HttpResponse.json(response)
  }),

  // ── 게시글 북마크 ──────────────────────────────

  http.post('*/v1/posts/:postId/bookmark', ({ params }) => {
    const postId = params.postId as string
    if (bookmarkedPosts.has(postId)) {
      return HttpResponse.json(
        { error_detail: { field_name: ['bookmark'] } },
        { status: 409 }
      )
    }
    bookmarkedPosts.add(postId)
    const next = (postBookmarkCounts.get(postId) ?? 0) + 1
    postBookmarkCounts.set(postId, next)
    const response: BookmarkResponse = { is_bookmarked: true, bookmark_count: next }
    return HttpResponse.json(response, { status: 201 })
  }),

  http.delete('*/v1/posts/:postId/bookmark', ({ params }) => {
    const postId = params.postId as string
    const wasBookmarked = bookmarkedPosts.delete(postId)
    const current = postBookmarkCounts.get(postId) ?? 0
    const next = wasBookmarked ? Math.max(0, current - 1) : current
    postBookmarkCounts.set(postId, next)
    const response: BookmarkResponse = { is_bookmarked: false, bookmark_count: next }
    return HttpResponse.json(response)
  }),

]
