import { apiClient } from '@/lib/apiClient'
import type { BookmarkListResponse, ExploreResponse } from '@/types'

export interface ExploreParams {
  search?: string
  category?: string
  cursor?: string
  seed?: number
  page_size?: number
}

export async function getExplorePosts(params: ExploreParams = {}): Promise<ExploreResponse> {
  const searchParams: Record<string, string> = {}
  if (params.search) searchParams.search = params.search
  if (params.category && params.category !== '전체') searchParams.category = params.category
  if (params.cursor) searchParams.cursor = params.cursor
  if (params.seed !== undefined) searchParams.seed = String(params.seed)
  if (params.page_size) searchParams.page_size = String(params.page_size)
  return apiClient.get('explore', { searchParams }).json<ExploreResponse>()
}

export interface GetBookmarksParams {
  cursor?: string
}

export async function getBookmarks(
  params: GetBookmarksParams = {},
): Promise<BookmarkListResponse> {
  const searchParams = params.cursor ? { cursor: params.cursor } : undefined
  return apiClient.get('posts/bookmarks', { searchParams }).json<BookmarkListResponse>()
}
