import { http, HttpResponse } from 'msw'
import type { Comment, CommentCreateResponse, CommentsListResponse } from '@/types'
import { SHOWCASE_MOCK_USER_ID } from '@/mocks/constants'
import { likedComments, commentLikeCounts } from './interactions'

const MOCK_USER_ID = SHOWCASE_MOCK_USER_ID

const commentsList: Comment[] = [
  {
    comment_id: 'comment-1',
    user: {
      id: '01JWNZ8KQE4VXRM2P7HFGB3YDN',
      is_deleted: false,
      nickname: 'oong_2',
      profile_img: 'https://picsum.photos/seed/user2/100/100',
    },
    content: '정말 멋진 여행이네요! 저도 가보고 싶어요.',
    comment_img: { img_url: null, original_img: null, key: null },
    created_at: '2026-05-28T12:00:00Z',
    updated_at: null,
    is_liked: false,
    like_count: 2,
  },
  {
    comment_id: 'comment-2',
    user: {
      id: '01JWNZ8KQE4VXRM2P7HFGB3ABC',
      is_deleted: false,
      nickname: '여행러버',
      profile_img: 'https://picsum.photos/seed/user3/100/100',
    },
    content: '성산일출봉 가보고 싶었는데 이 게시글 보니까 더 가고 싶어졌어요.',
    comment_img: { img_url: null, original_img: null, key: null },
    created_at: '2026-05-28T13:30:00Z',
    updated_at: null,
    is_liked: false,
    like_count: 5,
  },
  {
    comment_id: 'comment-3',
    user: {
      id: null,
      is_deleted: true,
      nickname: '탈퇴한 유저',
      profile_img: null,
    },
    content: '좋은 코스 공유해주셔서 감사해요!',
    comment_img: { img_url: null, original_img: null, key: null },
    created_at: '2026-05-29T09:00:00Z',
    updated_at: null,
    is_liked: false,
    like_count: 0,
  },
]

// mock 댓글 ID 생성 (3까지는 있어서 4부터 시작)
let commentIdCounter = 4

export const commentsHandlers = [
  // 댓글 목록 조회 — GET api/v1/comments?post_id=...
  http.get('*/v1/comments', ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 1)
    const pageSize = Number(url.searchParams.get('page_size') ?? 10)
    const start = (page - 1) * pageSize
    const paged = commentsList.slice(start, start + pageSize).map((c) => ({
      ...c,
      is_liked: likedComments.has(c.comment_id),
      like_count: commentLikeCounts.get(c.comment_id) ?? 0,
    }))

    const response: CommentsListResponse = {
      previous: page > 1 ? `${url.origin}${url.pathname}?page=${page - 1}&page_size=${pageSize}` : null,
      next: start + pageSize < commentsList.length ? `${url.origin}${url.pathname}?page=${page + 1}&page_size=${pageSize}` : null,
      results: paged,
    }
    return HttpResponse.json(response)
  }),

  // 댓글 생성 — POST api/v1/comments
  http.post('*/v1/comments', async ({ request }) => {
    const body = await request.json() as { post_id: string; content?: string; comment_img?: { original_img: string; key: string } }

    if (!body.content && !body.comment_img) {
      return HttpResponse.json(
        { error_detail: ["content와 comment_img 두 항목 중 하나는 입력해야합니다."] },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()
    const newComment: CommentCreateResponse = {
      comment_id: `comment-${commentIdCounter++}`,
      content: body.content ?? null,
      comment_img: body.comment_img
        ? { img_url: `https://picsum.photos/seed/comment${commentIdCounter}/200/200`, original_img: body.comment_img.original_img, key: body.comment_img.key }
        : { img_url: null, original_img: null, key: null },
      post_id: body.post_id,
      user_id: MOCK_USER_ID,
      created_at: now,
      updated_at: now,
    }

    commentsList.push({
      comment_id: newComment.comment_id,
      user: { id: MOCK_USER_ID, is_deleted: false, nickname: '나', profile_img: 'https://picsum.photos/seed/me/100/100' },
      content: newComment.content,
      comment_img: newComment.comment_img,
      created_at: now,
      updated_at: null,
      is_liked: false,
      like_count: 0,
    })
    commentLikeCounts.set(newComment.comment_id, 0)

    return HttpResponse.json(newComment, { status: 201 })
  }),

  // 댓글 수정 — PATCH api/v1/comments/{comment_id}
  http.patch('*/v1/comments/:commentId', async ({ params, request }) => {
    const { commentId } = params
    const body = await request.json() as { content?: string; comment_img?: { original_img: string; key: string } }
    const idx = commentsList.findIndex(c => c.comment_id === commentId)

    if (idx === -1) {
      return HttpResponse.json({ error_detail: '댓글을 찾을 수 없습니다.' }, { status: 404 })
    }

    const now = new Date().toISOString()
    commentsList[idx] = {
      ...commentsList[idx],
      content: body.content ?? commentsList[idx].content,
      comment_img: body.comment_img
        ? { img_url: `https://picsum.photos/seed/${body.comment_img.key}/200/200`, original_img: body.comment_img.original_img, key: body.comment_img.key }
        : commentsList[idx].comment_img,
      updated_at: now,
    }

    return HttpResponse.json({
      content: commentsList[idx].content,
      comment_img: commentsList[idx].comment_img,
      post_id: 'showcase-post',
      user_id: MOCK_USER_ID,
      created_at: commentsList[idx].created_at,
      updated_at: now,
    })
  }),

  // 댓글 삭제 — DELETE api/v1/comments/{comment_id}
  http.delete('*/v1/comments/:commentId', ({ params }) => {
    const { commentId } = params
    const idx = commentsList.findIndex(c => c.comment_id === commentId)

    if (idx === -1) {
      return HttpResponse.json({ error_detail: '댓글을 찾을 수 없습니다.' }, { status: 404 })
    }

    const [deleted] = commentsList.splice(idx, 1)
    commentLikeCounts.delete(deleted.comment_id)
    likedComments.delete(deleted.comment_id)
    return new HttpResponse(null, { status: 204 })
  }),

  // 댓글 이미지 presigned URL 발급 — POST api/v1/comments/presigned-url
  http.post('*/v1/comments/presigned-url', async ({ request }) => {
    const body = await request.json() as { original_img: string }
    const ext = body.original_img.split('.').pop()?.toLowerCase() ?? 'jpg'
    const allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp']

    if (!allowed.includes(ext)) {
      return HttpResponse.json({ error_detail: '유효하지 않은 파일 형식입니다.' }, { status: 400 })
    }

    const uuid = crypto.randomUUID()
    return HttpResponse.json(
      {
        presigned_url: `https://mock-bucket.s3.ap-northeast-2.amazonaws.com/prod/comments/${uuid}.${ext}?X-Amz-Signature=mock`,
        img_url: `https://mock-bucket.s3.ap-northeast-2.amazonaws.com/prod/comments/${uuid}.${ext}`,
        key: `prod/comments/${uuid}.${ext}`,
      },
      { status: 201 }
    )
  }),
]
