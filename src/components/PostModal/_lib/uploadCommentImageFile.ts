'use client'

import { getApiErrorMessage } from '@/lib/apiError'
import { uploadImage } from '@/lib/uploadImage'
import { toast } from '@/store/toastStore'
import type { CommentImageInput } from '@/types'

export async function uploadCommentImageFile(file: File): Promise<CommentImageInput> {
  try {
    const { key } = await uploadImage('comments/presigned-url', file)
    return { original_img: file.name, key }
  } catch (err) {
    toast.error(getApiErrorMessage(err, { client: '이미지 업로드에 실패했습니다.' }))
    throw err
  }
}
