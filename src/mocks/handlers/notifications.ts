/**
 * 알림 Mock 핸들러.
 * - GET    *\/notifications              cursor 기반 페이지네이션 목록 조회
 * - PATCH  *\/notifications/:id          개별 읽음 처리
 * - PATCH  *\/notifications              전체 읽음 처리
 * - DELETE *\/notifications/:id          개별 삭제
 * - DELETE *\/notifications              전체 삭제
 * - WS     *\/ws/notifications/:userId   미확인 알림 개수(unread_count) 실시간 push
 *
 * REST 변경 시 같은 사용자에게 연결되어 있는 모든 WebSocket 클라이언트에게
 * 갱신된 unread_count 를 다시 전송한다.
 */
import { http, HttpResponse, ws } from 'msw'
import type { RequestHandler, WebSocketHandler } from 'msw'

/** MSW가 콜백으로 넘겨주는 WebSocket client connection 타입. */
type WsClient = Parameters<
  Parameters<ReturnType<typeof ws.link>['addEventListener']>[1]
>[0]['client']

// ---------- 타입 ----------

export type TargetType = 'user' | 'post' | 'dm'
export type NotificationType = 'follow' | 'comment' | 'comment_like' | 'post_like' | 'dm'

export interface NotificationSender {
  user_id: string
  nickname: string
  profile_img: string
}

export interface NotificationItem {
  notification_id: string
  message: string
  created_at: string
  target_type: TargetType
  target_id: string
  notification_type: NotificationType
  is_read: boolean
  sender: NotificationSender
}

interface NotificationListResponse {
  next: string | null
  results: NotificationItem[]
}

// ---------- Mock 데이터 ----------

const SENDERS: NotificationSender[] = [
  { user_id: '01HSENDER000000000000000001', nickname: '김다님', profile_img: 'https://picsum.photos/seed/sender1/96/96' },
  { user_id: '01HSENDER000000000000000002', nickname: '박여행', profile_img: 'https://picsum.photos/seed/sender2/96/96' },
  { user_id: '01HSENDER000000000000000003', nickname: '이바다', profile_img: 'https://picsum.photos/seed/sender3/96/96' },
  { user_id: '01HSENDER000000000000000004', nickname: '최산정', profile_img: 'https://picsum.photos/seed/sender4/96/96' },
  { user_id: '01HSENDER000000000000000005', nickname: '정도시', profile_img: 'https://picsum.photos/seed/sender5/96/96' },
  { user_id: '01HSENDER000000000000000006', nickname: '윤하늘', profile_img: 'https://picsum.photos/seed/sender6/96/96' },
  { user_id: '01HSENDER000000000000000007', nickname: '서노을', profile_img: 'https://picsum.photos/seed/sender7/96/96' },
]

// post 하위 notification_type 순환
const POST_NOTIFICATION_TYPES: NotificationType[] = ['comment', 'comment_like', 'post_like']

const buildMessage = (notificationType: NotificationType, nickname: string): string => {
  switch (notificationType) {
    case 'follow':        return `${nickname}님이 회원님을 팔로우하기 시작했습니다.`
    case 'post_like':     return `${nickname}님이 회원님의 게시글을 좋아합니다.`
    case 'comment':       return `${nickname}님이 회원님의 게시글에 댓글을 남겼습니다.`
    case 'comment_like':  return `${nickname}님이 회원님의 댓글을 좋아합니다.`
    case 'dm':            return `${nickname}님이 메시지를 보냈습니다.`
  }
}

interface TargetInfo {
  target_type: TargetType
  target_id: string
  notification_type: NotificationType
}

const buildTarget = (idx: number): TargetInfo => {
  // 20개를 user 4 : post 12 : dm 4 비율로 분배
  const mod = idx % 5
  if (mod === 0) {
    // user → follow, target_id = user_id
    return {
      target_type: 'user',
      target_id: SENDERS[idx % SENDERS.length].user_id,
      notification_type: 'follow',
    }
  } else if (mod === 4) {
    // dm → target_id = user_id (프론트에서 해당 유저의 채팅방으로 분기)
    return {
      target_type: 'dm',
      target_id: SENDERS[(idx + 1) % SENDERS.length].user_id,
      notification_type: 'dm',
    }
  } else {
    // post → target_id = post_id, notification_type 세분화
    const postNotifType = POST_NOTIFICATION_TYPES[idx % POST_NOTIFICATION_TYPES.length]
    return {
      target_type: 'post',
      target_id: `01HPOST00000000000000${String(idx).padStart(6, '0')}`,
      notification_type: postNotifType,
    }
  }
}

// 최신순으로 정렬되도록 큰 인덱스부터 더 최근 created_at 을 가지도록 한다.
const NOW = Date.UTC(2026, 5, 15, 9, 0, 0) // 2026-06-15 09:00:00Z 기준
const TOTAL = 20

const createInitialNotifications = (): NotificationItem[] => {
  const items: NotificationItem[] = []
  for (let i = 0; i < TOTAL; i++) {
    const sender = SENDERS[i % SENDERS.length]
    const target = buildTarget(i)
    const seq = String(TOTAL - i).padStart(6, '0')
    items.push({
      notification_id: `01HNOTIF000000000000${seq}`,
      message: buildMessage(target.notification_type, sender.nickname),
      created_at: new Date(NOW - i * 1000 * 60 * 17).toISOString(),
      target_type: target.target_type,
      target_id: target.target_id,
      notification_type: target.notification_type,
      is_read: i >= 6,
      sender,
    })
  }
  return items
}

// 모듈 스코프 상태(개발 환경에서만 사용되는 mock 상태)
const notifications: NotificationItem[] = createInitialNotifications()

const getUnreadCount = (): number => notifications.filter((n) => !n.is_read).length

// ---------- WebSocket 브로드캐스트 ----------

const notificationsWs = ws.link('*/ws/notifications')

/** 인증된 클라이언트 집합. 인증 전 클라이언트에는 브로드캐스트하지 않는다. */
const authedClients = new WeakSet<WsClient>()

interface UnreadCountMessage {
  type: 'unread_count'
  count: number
}

interface ErrorMessage {
  type: 'error'
  detail: string
}

const buildUnreadMessage = (): UnreadCountMessage => ({
  type: 'unread_count',
  count: getUnreadCount(),
})

const broadcastUnreadCount = (): void => {
  // ws.link.broadcast는 연결된 모든 클라이언트에 전송한다.
  // mock 환경에서는 인증 여부와 무관하게 push해도 클라이언트가 인증 전이면 무시할 수 있도록 한다.
  notificationsWs.broadcast(JSON.stringify(buildUnreadMessage()))
}

// ---------- REST 핸들러 ----------

const unauthorized = () =>
  HttpResponse.json({ error_detail: '인증되지 않은 사용자입니다.' }, { status: 401 })

export const notificationHandlers: RequestHandler[] = [
  // 목록 조회 (cursor 페이징)
  http.get('*/notifications', ({ request }) => {
    if (!request.headers.get('Authorization')) return unauthorized()

    const url = new URL(request.url)
    const cursor = url.searchParams.get('cursor')
    const pageSize = Number(url.searchParams.get('page_size') ?? '10')

    const cursorIdx = cursor ? notifications.findIndex((n) => n.notification_id === cursor) : -1
    const offset = cursorIdx + 1
    const sliced = notifications.slice(offset, offset + pageSize)
    const hasNext = offset + pageSize < notifications.length
    const last = sliced[sliced.length - 1]

    const response: NotificationListResponse = {
      next: hasNext && last ? last.notification_id : null,
      results: sliced,
    }
    return HttpResponse.json(response)
  }),

  // 전체 읽음 처리 (동적 라우트보다 먼저 매칭되도록 위에 둔다)
  http.patch('*/notifications', ({ request }) => {
    if (!request.headers.get('Authorization')) return unauthorized()

    for (const n of notifications) n.is_read = true
    broadcastUnreadCount()
    return HttpResponse.json({ message: '모든 알림이 읽음 처리 되었습니다.' })
  }),

  // 개별 읽음 처리
  http.patch('*/notifications/:notification_id', ({ request, params }) => {
    if (!request.headers.get('Authorization')) return unauthorized()

    const id = params.notification_id as string
    const target = notifications.find((n) => n.notification_id === id)
    if (!target) {
      return HttpResponse.json({ error_detail: '존재하지 않는 알림입니다.' }, { status: 404 })
    }
    if (target.is_read) {
      return HttpResponse.json({ error_detail: '이미 읽은 알림입니다.' }, { status: 409 })
    }
    target.is_read = true
    broadcastUnreadCount()
    return HttpResponse.json({ notification_id: target.notification_id, is_read: true })
  }),

  // 전체 삭제
  http.delete('*/notifications', ({ request }) => {
    if (!request.headers.get('Authorization')) return unauthorized()

    notifications.length = 0
    broadcastUnreadCount()
    return HttpResponse.json({ message: '알림이 모두 삭제되었습니다.' })
  }),

  // 개별 삭제
  http.delete('*/notifications/:notification_id', ({ request, params }) => {
    if (!request.headers.get('Authorization')) return unauthorized()

    const id = params.notification_id as string
    const idx = notifications.findIndex((n) => n.notification_id === id)
    if (idx === -1) {
      return HttpResponse.json({ error_detail: '존재하지 않는 알림입니다.' }, { status: 404 })
    }
    const [removed] = notifications.splice(idx, 1)
    broadcastUnreadCount()
    return HttpResponse.json({ notification_id: removed.notification_id })
  }),
]

// ---------- WebSocket 핸들러 ----------

const AUTH_TIMEOUT_MS = 10_000

export const notificationWsHandlers: WebSocketHandler[] = [
  notificationsWs.addEventListener('connection', ({ client }) => {
    // 10초 안에 첫 auth 메시지를 수신하지 못하면 연결을 종료한다.
    const timeoutId = setTimeout(() => {
      if (!authedClients.has(client)) {
        client.send(JSON.stringify({ type: 'error', detail: '인증에 실패했습니다.' } satisfies ErrorMessage))
        client.close()
      }
    }, AUTH_TIMEOUT_MS)

    client.addEventListener('message', (event) => {
      // 인증된 클라이언트는 이후 메시지를 무시 (mock 환경)
      if (authedClients.has(client)) return

      const raw = typeof event.data === 'string' ? event.data : ''
      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch {
        client.send(JSON.stringify({ type: 'error', detail: '인증에 실패했습니다.' } satisfies ErrorMessage))
        client.close()
        clearTimeout(timeoutId)
        return
      }

      const isAuthMessage =
        typeof parsed === 'object' &&
        parsed !== null &&
        (parsed as { type?: unknown }).type === 'auth' &&
        typeof (parsed as { token?: unknown }).token === 'string' &&
        ((parsed as { token: string }).token.length > 0)

      if (!isAuthMessage) {
        client.send(JSON.stringify({ type: 'error', detail: '인증에 실패했습니다.' } satisfies ErrorMessage))
        client.close()
        clearTimeout(timeoutId)
        return
      }

      // 토큰이 존재하면 통과 (mock 환경)
      authedClients.add(client)
      clearTimeout(timeoutId)
      client.send(JSON.stringify(buildUnreadMessage()))
    })

    client.addEventListener('close', () => {
      clearTimeout(timeoutId)
    })
  }),
]
