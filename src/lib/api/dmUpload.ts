'use client'

import { uploadImage } from '@/lib/media/uploadImage'
import type { DmPresignedUrlResponse } from '@/types'

export async function uploadDmImage(
  conversationId: string,
  file: File,
): Promise<DmPresignedUrlResponse> {
  return uploadImage(`direct-messages/conversations/${conversationId}/messages/presigned-url`, file)
}
