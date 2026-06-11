import { http, HttpResponse } from 'msw'
import type { LikeResponse, BookmarkResponse } from '@/types'
import {
  likedPosts,
  likedComments,
  bookmarkedPosts,
  postLikeCounts,
  postBookmarkCounts,
  commentLikeCounts,
} from '../lib/mockState'

export {
  likedPosts,
  likedComments,
  bookmarkedPosts,
  postLikeCounts,
  postBookmarkCounts,
  commentLikeCounts,
}


export const interactionsHandlers = [
  // ── 게시글 좋아요 ───────────────────────────────

  http.post('*/posts/:postId/like', ({ params }) => {
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

  http.delete('*/posts/:postId/like', ({ params }) => {
    const postId = params.postId as string
    const wasLiked = likedPosts.delete(postId)
    const current = postLikeCounts.get(postId) ?? 0
    const next = wasLiked ? Math.max(0, current - 1) : current
    postLikeCounts.set(postId, next)
    const response: LikeResponse = { is_liked: false, like_count: next }
    return HttpResponse.json(response)
  }),

  // ── 댓글 좋아요 ────────────────────────────────

  http.post('*/comments/:commentId/like', ({ params }) => {
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

  http.delete('*/comments/:commentId/like', ({ params }) => {
    const commentId = params.commentId as string
    const wasLiked = likedComments.delete(commentId)
    const current = commentLikeCounts.get(commentId) ?? 0
    const next = wasLiked ? Math.max(0, current - 1) : current
    commentLikeCounts.set(commentId, next)
    const response: LikeResponse = { is_liked: false, like_count: next }
    return HttpResponse.json(response)
  }),

  // ── 게시글 북마크 ──────────────────────────────

  http.post('*/posts/:postId/bookmark', ({ params }) => {
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

  http.delete('*/posts/:postId/bookmark', ({ params }) => {
    const postId = params.postId as string
    const wasBookmarked = bookmarkedPosts.delete(postId)
    const current = postBookmarkCounts.get(postId) ?? 0
    const next = wasBookmarked ? Math.max(0, current - 1) : current
    postBookmarkCounts.set(postId, next)
    const response: BookmarkResponse = { is_bookmarked: false, bookmark_count: next }
    return HttpResponse.json(response)
  }),

]
