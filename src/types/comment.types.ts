export type CommentUser = {
  id: string | null
  is_deleted: boolean
  nickname: string
  profile_img: string | null
}

export type CommentImage = {
  img_url: string | null
  original_img: string | null
  key: string | null
}

export type CommentImageInput = {
  original_img: string
  key: string
}

export type Comment = {
  comment_id: string
  user: CommentUser
  content: string | null
  comment_img: CommentImage
  created_at: string
  updated_at: string | null
  is_liked: boolean
  like_count: number
}

export type CommentCreateRequest = {
  post_id: string
  content?: string | null
  comment_img?: CommentImageInput
}

export type CommentUpdateRequest = {
  content?: string | null
  comment_img?: CommentImageInput | null
}

export type CommentCreateResponse = {
  comment_id: string
  content: string | null
  comment_img: CommentImage
  post_id: string
  user_id: string
  created_at: string
  updated_at: string
}

export type CommentUpdateResponse = {
  content: string | null
  comment_img: CommentImage
  post_id: string
  user_id: string
  created_at: string
  updated_at: string
}

export type CommentPresignedUrlRequest = {
  original_img: string
}

export type CommentPresignedUrlResponse = {
  presigned_url: string
  img_url: string
  key: string
}

export type CommentsListResponse = {
  previous: string | null
  next: string | null
  results: Comment[]
}

