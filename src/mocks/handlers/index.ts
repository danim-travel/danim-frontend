/**
 * MSW 핸들러 모음. 도메인별 핸들러를 한곳에 모아 worker에 등록한다.
 */
import { authHandlers } from './auth'
import { postsHandlers } from './posts'
import type { RequestHandler } from 'msw'

export const handlers: RequestHandler[] = [
  ...authHandlers,
  ...postsHandlers,
]
