import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { queryKeys } from '@/lib/queryKeys'
import type { UserProfileResponse } from '@/types'

/**
 * 내 프로필 조회 훅.
 * userId가 없으면 호출하지 않는다 (비로그인/하이드레이션 전 상태 대응).
 */
export function useMyProfile(userId: string) {
  return useQuery({
    queryKey: queryKeys.users.profile(userId),
    queryFn: () =>
      apiClient.get(`v1/users/${userId}/profile`).json<UserProfileResponse>(),
    refetchOnWindowFocus: false,
  })
}
