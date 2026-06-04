/**
 * MSW 브라우저 워커 설정.
 * 개발 환경에서 API 요청을 가로채 mock 응답을 반환한다.
 */
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
