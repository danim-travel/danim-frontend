import { apiClient, publicClient } from '@/lib/apiClient'
import type { BookmarkListResponse, ExploreResponse } from '@/types'

export interface SharePostResponse {
  redirect_url: string
}

// 인증 불필요 엔드포인트이므로 publicClient 사용 — apiClient 사용 시 토큰 만료 직후 강제 로그아웃 위험 있음
export async function sharePost(postId: string): Promise<SharePostResponse> {
  return publicClient.get(`posts/${postId}/share`).json<SharePostResponse>()
}

export interface ExploreParams {
  search?: string
  category?: string
  cursor?: string
  seed?: number
  page_size?: number
}

export async function getExplorePosts(params: ExploreParams = {}): Promise<ExploreResponse> {
  // search(한글)를 ky의 searchParams 옵션으로 넘기면 내부적으로 URLSearchParams가
  // 퍼센트 인코딩(예: 제주 → %EC%A0%9C%EC%A3%BC)한다.
  // 원문 한글 그대로 전달하기 위해 쿼리 문자열을 직접 조립한다.
  // (ky의 searchParams 옵션은 URL에 이미 있는 쿼리를 덮어쓰므로 혼용하지 않고 전부 직접 조립)
  const queryParts: string[] = []
  if (params.search) queryParts.push(`search=${params.search}`)
  if (params.category && params.category !== '전체') queryParts.push(`category=${params.category}`)
  // cursor는 Base64(+, /, = 포함 가능)일 수 있으므로 안전하게 인코딩한다.
  if (params.cursor) queryParts.push(`cursor=${encodeURIComponent(params.cursor)}`)
  if (params.seed !== undefined) queryParts.push(`seed=${params.seed}`)
  if (params.page_size) queryParts.push(`page_size=${params.page_size}`)

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : ''
  return apiClient.get(`explore${queryString}`).json<ExploreResponse>()
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
