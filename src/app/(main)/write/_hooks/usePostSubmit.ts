'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { getApiErrorMessage } from '@/lib/apiError'
import { toast } from '@/store/toastStore'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/store/authStore'
import type { DetailResponse } from '@/types'
import type { SpotFormData } from '../_types/write.types'
import { buildPostPayload } from '../_helpers/postPayload.helper'

type UsePostSubmitArgs = {
  title: string
  description: string
  spots: SpotFormData[]
  thumbnailKey: string | null
}

export function usePostSubmit({ title, description, spots, thumbnailKey }: UsePostSubmitArgs) {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.userId)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 전체 제목·소개 입력, 모든 스팟에 본문·위치·사진 1장, 썸네일 선택 모두 충족해야 제출 가능
  const canSubmit =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    spots.every((s) => s.content.trim().length > 0 && s.location !== null && s.images.length > 0) &&
    thumbnailKey !== null &&
    !isSubmitting

  const submitPost = async (): Promise<boolean> => {
    if (isSubmitting || !canSubmit) return false
    setIsSubmitting(true)
    // canSubmit이 thumbnailKey !== null을 보장하므로 타입 단언 사용
    const payload = buildPostPayload({ title, description, spots, thumbnailKey: thumbnailKey! })

    try {
      await apiClient.post('posts', { json: payload }).json<DetailResponse>()
      // 탐색 페이지·마이페이지에 새 게시글 즉시 반영
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.posts.exploreBase }),
        ...(userId ? [queryClient.invalidateQueries({ queryKey: queryKeys.users.profile(userId) })] : []),
      ])
      return true
    } catch (err) {
      console.error('게시글 작성 실패:', err)
      toast.error(getApiErrorMessage(err, { client: '게시글 작성에 실패했습니다.' }))
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    canSubmit,
    isSubmitting,
    submitPost,
  }
}
