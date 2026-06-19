/**
 * MSW 핸들러 모음. 도메인별 핸들러를 한곳에 모아 worker에 등록한다.
 */
import { http, passthrough } from 'msw'
import { commentsHandlers } from './comments'
import { postsHandlers } from './posts'
import { mainFeedHandlers } from './mainFeed'
import { interactionsHandlers } from './interactions'
import { usersHandlers, followHandlers } from './users'
import { exploreHandlers } from './explore'
import { notificationHandlers, notificationWsHandlers } from './notifications'
import { dmHandlers, dmWsHandlers } from './dm'
import type { RequestHandler, WebSocketHandler } from 'msw'

// Next.js 이미지 최적화 요청은 MSW를 거치지 않고 실제 서버로 전달
const nextInternalHandlers: RequestHandler[] = [
  http.get('/_next/*', () => passthrough()),
]

export const handlers: Array<RequestHandler | WebSocketHandler> = [
  ...nextInternalHandlers,
  // ...authHandlers,
  // ...commentsHandlers,
  // mainFeed가 동적 라우트 *./posts/:postId 보다 먼저 매칭되도록 앞에 둔다.
  // ...mainFeedHandlers,
  // ...postsHandlers,
  // ...interactionsHandlers,
  // ...usersHandlers,
  // ...followHandlers,
  ...exploreHandlers,
  ...notificationHandlers,
  ...notificationWsHandlers,
  ...dmHandlers,
  ...dmWsHandlers,
]
