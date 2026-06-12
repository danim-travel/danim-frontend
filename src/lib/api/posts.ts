import { apiClient } from '@/lib/apiClient'
import type { ExploreResponse } from '@/types'

export interface ExploreParams {
  search?: string
  category?: string
  cursor?: string
  page_size?: number
}

export async function getExplorePosts(params: ExploreParams = {}): Promise<ExploreResponse> {
  const searchParams: Record<string, string> = {}
  if (params.search) searchParams.search = params.search
  if (params.category && params.category !== '전체') searchParams.category = params.category
  if (params.cursor) searchParams.cursor = params.cursor
  if (params.page_size) searchParams.page_size = String(params.page_size)
  return apiClient.get('posts/explore', { searchParams }).json<ExploreResponse>()
}
