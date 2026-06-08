'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient, getApiErrorMessage } from '@/lib/apiClient'
import { toast } from '@/store/toastStore'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/store/authStore'
import type { DetailResponse } from '@/types'
import type { SpotFormData } from '../_types/write.types'
import { buildPostPayload } from '../_helpers/postPayload.helper'

type UsePostSubmitArgs = {
  title: string
  spots: SpotFormData[]
  thumbnailKey: string | null
}

export function usePostSubmit({ title, spots, thumbnailKey }: UsePostSubmitArgs) {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.userId)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 제목 입력, 위치가 있는 스팟 존재, 썸네일 선택 모두 충족해야 제출 가능
  const canSubmit =
    title.trim().length > 0 &&
    spots.some((s) => s.location !== null) &&
    thumbnailKey !== null &&
    !isSubmitting

  const submitPost = async (): Promise<boolean> => {
    if (isSubmitting || !canSubmit) return false
    setIsSubmitting(true)
    // canSubmit이 thumbnailKey !== null을 보장하므로 타입 단언 사용
    const payload = buildPostPayload({ title, spots, thumbnailKey: thumbnailKey! })

    try {
      await apiClient.post('v1/posts', { json: payload }).json<DetailResponse>()
      // 탐색 페이지·마이페이지에 새 게시글 즉시 반영
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.posts.exploreBase }),
        ...(userId ? [queryClient.invalidateQueries({ queryKey: queryKeys.users.profile(userId) })] : []),
      ])
      return true
    } catch (err) {
      console.error('게시글 작성 실패:', err)
      toast.error(getApiErrorMessage(err, {
        client: '게시글 작성에 실패했습니다.',
        server: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      }))
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
