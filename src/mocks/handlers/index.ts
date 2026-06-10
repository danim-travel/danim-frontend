/**
 * MSW 핸들러 모음. 도메인별 핸들러를 한곳에 모아 worker에 등록한다.
 */
import { authHandlers } from './auth'
import { commentsHandlers } from './comments'
import { postsHandlers } from './posts'
import { interactionsHandlers } from './interactions'
import { usersHandlers } from './users'
import type { RequestHandler } from 'msw'

export const handlers: RequestHandler[] = [
  ...authHandlers,
  ...commentsHandlers,
  ...postsHandlers,
  ...interactionsHandlers,
  ...usersHandlers,
]
