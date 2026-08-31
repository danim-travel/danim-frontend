'use client'

import { getApiErrorMessage } from '@/lib/apiError'
import { uploadImage } from '@/lib/media/uploadImage'
import { IMAGE_POLICY } from '@/lib/media/imageConstraints'
import { toast } from '@/store/toastStore'
import type { CommentImageInput } from '@/types'

export async function uploadCommentImageFile(file: File): Promise<CommentImageInput> {
  try {
    // 댓글 정책(GIF 허용 · 5MB)을 넘기지 않으면 마지막 방어선에서 GIF가 막힌다.
    const { key } = await uploadImage('comments/presigned-url', file, IMAGE_POLICY.comment)
    return { original_img: file.name, key }
  } catch (err) {
    toast.error(getApiErrorMessage(err, { client: '이미지 업로드에 실패했습니다.' }))
    throw err
  }
}
