import { apiClient } from '@/lib/apiClient'
import type { SocketKeyResponse } from '@/types/notification.types'

/**
 * 일회성 WebSocket 인증 키(socket_key)를 발급받는다.
 *
 * 발급된 키는 WS URL의 `?socket_key=<uuid>` 쿼리 파라미터로 전달한다.
 * access_token 자체를 WS 트래픽에 노출하지 않기 위해 도입된 방식이다.
 *
 * - 401 응답은 apiClient의 토큰 갱신 흐름이 자동 처리한다.
 * - 호출자는 발급 실패 시 자체 백오프 재시도 정책을 적용한다.
 */
export async function issueSocketKey(): Promise<SocketKeyResponse> {
  return apiClient.post('websocket-key').json<SocketKeyResponse>()
}
