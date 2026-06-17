/**
 * DM Mock 핸들러.
 * - POST   *\/direct-messages/conversations                                  대화방 생성 (이미 있으면 기존 반환)
 * - GET    *\/direct-messages/conversations                                  대화방 목록
 * - DELETE *\/direct-messages/conversations/:conversation_id                 대화방 나가기
 * - POST   *\/direct-messages/conversations/:conversation_id/messages/presigned-url  이미지 presigned URL 발급
 * - DELETE *\/direct-messages/conversations/:conversation_id/messages/:message_id    메시지 삭제
 * - GET    *\/direct-messages/conversations/:conversation_id/messages        메시지 목록 (cursor 페이지네이션, 최신순)
 * - WS     *\/ws/dm                                                          실시간 메시지 송수신
 */
import { http, HttpResponse, ws } from 'msw'
import type { RequestHandler, WebSocketHandler } from 'msw'
import { SHOWCASE_MOCK_USER_ID, MOCK_USER } from '../constants'
import type {
  Conversation,
  LastMessage,
  Message,
  UserBrief,
  ConversationListResponse,
  MessageListResponse,
  CreateConversationResponse,
  DmPresignedUrlResponse,
  DmWsServerMessage,
} from '@/types'

/** MSW가 콜백으로 넘겨주는 WebSocket client connection 타입. */
type WsClient = Parameters<
  Parameters<ReturnType<typeof ws.link>['addEventListener']>[1]
>[0]['client']

// ---------- Mock 데이터 ----------

const NOW = Date.UTC(2026, 5, 17, 12, 0, 0) // 2026-06-17 12:00:00Z 기준

const OPPONENTS: Conversation['opponent'][] = [
  { user_id: '01HDMPARTNER0000000000001', nickname: '김다님', profile_img: 'https://picsum.photos/seed/dmp1/96/96' },
  { user_id: '01HDMPARTNER0000000000002', nickname: '박여행', profile_img: 'https://picsum.photos/seed/dmp2/96/96' },
  { user_id: '01HDMPARTNER0000000000003', nickname: '이바다', profile_img: null },
]

const conversations: Conversation[] = [
  {
    conversation_id: '01HDMCONV000000000000001',
    opponent: OPPONENTS[0],
    last_message: { content: '제주도 어땠어요?', img_url: '', created_at: new Date(NOW - 1000 * 60 * 5).toISOString() },
    unread_count: 2,
    created_at: new Date(NOW - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    conversation_id: '01HDMCONV000000000000002',
    opponent: OPPONENTS[1],
    last_message: { content: '다음 여행지는 어디예요?', img_url: '', created_at: new Date(NOW - 1000 * 60 * 60 * 2).toISOString() },
    unread_count: 0,
    created_at: new Date(NOW - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    conversation_id: '01HDMCONV000000000000003',
    opponent: OPPONENTS[2],
    last_message: { content: '안녕하세요!', img_url: '', created_at: new Date(NOW - 1000 * 60 * 60 * 24).toISOString() },
    unread_count: 1,
    created_at: new Date(NOW - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
]

// 대화방 ID 전용 카운터 — 삭제 후에도 재사용되지 않도록 단조 증가
let convSeq = conversations.length + 1

const ME: UserBrief = { user_id: SHOWCASE_MOCK_USER_ID, nickname: MOCK_USER.nickname, profile_img: MOCK_USER.profileImg }

// conversation_id → Message[] (최신순)
const messageStore = new Map<string, Message[]>([
  [
    '01HDMCONV000000000000001',
    [
      { message_id: '01HDMMSG000000000000005', sender: OPPONENTS[0], content: '제주도 어땠어요?',   img_url: null, original_img: null, is_deleted: false, created_at: new Date(NOW - 1000 * 60 * 5).toISOString() },
      { message_id: '01HDMMSG000000000000004', sender: OPPONENTS[0], content: '사진 올려줘요!',     img_url: null, original_img: null, is_deleted: false, created_at: new Date(NOW - 1000 * 60 * 10).toISOString() },
      { message_id: '01HDMMSG000000000000003', sender: ME,           content: '저도 가고 싶어요.',  img_url: null, original_img: null, is_deleted: false, created_at: new Date(NOW - 1000 * 60 * 30).toISOString() },
      { message_id: '01HDMMSG000000000000002', sender: OPPONENTS[0], content: '저 지금 제주도예요.',img_url: null, original_img: null, is_deleted: false, created_at: new Date(NOW - 1000 * 60 * 60).toISOString() },
      { message_id: '01HDMMSG000000000000001', sender: ME,           content: '안녕하세요!',        img_url: null, original_img: null, is_deleted: false, created_at: new Date(NOW - 1000 * 60 * 60 * 24 * 3).toISOString() },
    ],
  ],
  [
    '01HDMCONV000000000000002',
    [
      { message_id: '01HDMMSG000000000000008', sender: OPPONENTS[1], content: '다음 여행지는 어디예요?', img_url: null, original_img: null, is_deleted: false, created_at: new Date(NOW - 1000 * 60 * 60 * 2).toISOString() },
      { message_id: '01HDMMSG000000000000007', sender: ME,           content: '저는 부산 다녀왔어요.',   img_url: null, original_img: null, is_deleted: false, created_at: new Date(NOW - 1000 * 60 * 60 * 3).toISOString() },
      { message_id: '01HDMMSG000000000000006', sender: OPPONENTS[1], content: '반가워요!',               img_url: null, original_img: null, is_deleted: false, created_at: new Date(NOW - 1000 * 60 * 60 * 24 * 7).toISOString() },
    ],
  ],
  [
    '01HDMCONV000000000000003',
    [
      { message_id: '01HDMMSG000000000000009', sender: OPPONENTS[2], content: '안녕하세요!', img_url: null, original_img: null, is_deleted: false, created_at: new Date(NOW - 1000 * 60 * 60 * 24).toISOString() },
    ],
  ],
])

// C10: 모듈 리로드(HMR) 시 카운터가 리셋되어 TQ 캐시의 기존 ID와 충돌하는 것을 방지
const createMessageId = (): string => {
  const ts = Date.now().toString(36).toUpperCase().padStart(10, '0')
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `01HDMMSG${ts}${rand}`
}

// ---------- 공통 헬퍼 ----------

const unauthorized = () =>
  HttpResponse.json({ error_detail: '인증되지 않은 사용자입니다.' }, { status: 401 })

const isAuthed = (request: Request): boolean =>
  !!request.headers.get('Authorization')

// ---------- REST 핸들러 ----------

export const dmHandlers: RequestHandler[] = [
  // 대화방 생성 (이미 존재하면 기존 반환)
  http.post('*/direct-messages/conversations', async ({ request }) => {
    if (!isAuthed(request)) return unauthorized()

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return HttpResponse.json({ error_detail: '요청 본문이 올바르지 않습니다.' }, { status: 400 })
    }

    const parsed = body as { receiver_id?: unknown }
    if (typeof parsed.receiver_id !== 'string' || !parsed.receiver_id) {
      return HttpResponse.json({ error_detail: 'receiver_id가 필요합니다.' }, { status: 400 })
    }

    const receiverId = parsed.receiver_id
    const opponent = OPPONENTS.find((o) => o.user_id === receiverId)
    if (!opponent) {
      return HttpResponse.json({ error_detail: '존재하지 않는 사용자입니다.' }, { status: 404 })
    }

    const existing = conversations.find((c) => c.opponent.user_id === receiverId)
    if (existing) {
      const res: CreateConversationResponse = {
        conversation_id: existing.conversation_id,
        opponent: existing.opponent,
        created_at: existing.created_at,
      }
      return HttpResponse.json(res)
    }

    const now = new Date().toISOString()
    const newConv: Conversation = {
      conversation_id: `01HDMCONV${String(convSeq++).padStart(15, '0')}`,
      opponent,
      last_message: null,
      unread_count: 0,
      created_at: now,
    }
    conversations.unshift(newConv)
    messageStore.set(newConv.conversation_id, [])

    const res: CreateConversationResponse = {
      conversation_id: newConv.conversation_id,
      opponent,
      created_at: now,
    }
    return HttpResponse.json(res, { status: 201 })
  }),

  // 대화방 목록
  http.get('*/direct-messages/conversations', ({ request }) => {
    if (!isAuthed(request)) return unauthorized()

    const sorted = [...conversations].sort((a, b) => {
      const ta = a.last_message?.created_at ?? a.created_at
      const tb = b.last_message?.created_at ?? b.created_at
      return tb.localeCompare(ta)
    })

    return HttpResponse.json({ results: sorted } satisfies ConversationListResponse)
  }),

  // 대화방 나가기
  http.delete('*/direct-messages/conversations/:conversation_id', ({ request, params }) => {
    if (!isAuthed(request)) return unauthorized()

    const convId = params.conversation_id as string
    const idx = conversations.findIndex((c) => c.conversation_id === convId)
    if (idx === -1) {
      return HttpResponse.json({ error_detail: '존재하지 않는 대화방입니다.' }, { status: 404 })
    }
    conversations.splice(idx, 1)
    messageStore.delete(convId)
    return new HttpResponse(null, { status: 204 })
  }),

  // 이미지 presigned URL 발급 — 동적 :message_id 보다 먼저 매칭되도록 위에 둔다
  http.post('*/direct-messages/conversations/:conversation_id/messages/presigned-url', ({ request, params }) => {
    if (!isAuthed(request)) return unauthorized()

    const convId = params.conversation_id as string
    if (!messageStore.has(convId)) {
      return HttpResponse.json({ error_detail: '존재하지 않는 대화방입니다.' }, { status: 404 })
    }

    const mockKey = `dm/${convId}/${Date.now()}.jpg`
    const res: DmPresignedUrlResponse = {
      presigned_url: `https://mock-s3.example.com/${mockKey}?X-Amz-Signature=mock`,
      img_url: `https://mock-cdn.example.com/${mockKey}`,
      key: mockKey,
    }
    return HttpResponse.json(res, { status: 201 })
  }),

  // 메시지 삭제
  http.delete('*/direct-messages/conversations/:conversation_id/messages/:message_id', ({ request, params }) => {
    if (!isAuthed(request)) return unauthorized()

    const convId = params.conversation_id as string
    const msgId = params.message_id as string
    const messages = messageStore.get(convId)
    if (!messages) {
      return HttpResponse.json({ error_detail: '존재하지 않는 대화방입니다.' }, { status: 404 })
    }
    const msg = messages.find((m) => m.message_id === msgId)
    if (!msg) {
      return HttpResponse.json({ error_detail: '존재하지 않는 메시지입니다.' }, { status: 404 })
    }
    msg.is_deleted = true

    // 삭제 후 해당 대화방의 last_message를 최신 non-deleted 메시지로 재계산
    const conv = conversations.find((c) => c.conversation_id === convId)
    if (conv) {
      const latest = messages.find((m) => !m.is_deleted)
      conv.last_message = latest
        ? { content: latest.content, img_url: '', created_at: latest.created_at }
        : null
    }

    return new HttpResponse(null, { status: 204 })
  }),

  // 메시지 목록 (cursor 페이지네이션, 최신순)
  http.get('*/direct-messages/conversations/:conversation_id/messages', ({ request, params }) => {
    if (!isAuthed(request)) return unauthorized()

    const convId = params.conversation_id as string
    const messages = messageStore.get(convId)
    if (!messages) {
      return HttpResponse.json({ error_detail: '존재하지 않는 대화방입니다.' }, { status: 404 })
    }

    const url = new URL(request.url)
    const cursor = url.searchParams.get('cursor')
    const pageSize = Number(url.searchParams.get('page_size') ?? '20')

    const cursorIdx = cursor ? messages.findIndex((m) => m.message_id === cursor) : -1
    const offset = cursorIdx + 1
    const sliced = messages.slice(offset, offset + pageSize)
    const hasNext = offset + pageSize < messages.length
    const last = sliced[sliced.length - 1]

    return HttpResponse.json({
      next: hasNext && last ? last.message_id : null,
      results: sliced,
    } satisfies MessageListResponse)
  }),
]

// ---------- WebSocket ----------

const dmWs = ws.link('*/ws/dm')

const authedClients = new Set<WsClient>()
// C3: 클라이언트가 메시지를 전송한 대화방 ID를 추적해 해당 대화방 참여자에게만 브로드캐스트
const clientConversations = new Map<WsClient, Set<string>>()

const AUTH_TIMEOUT_MS = 10_000

export const dmWsHandlers: WebSocketHandler[] = [
  dmWs.addEventListener('connection', ({ client }) => {
    const timeoutId = setTimeout(() => {
      if (!authedClients.has(client)) {
        client.send(JSON.stringify({ type: 'error', detail: '인증에 실패했습니다.' } satisfies DmWsServerMessage))
        client.close()
      }
    }, AUTH_TIMEOUT_MS)

    client.addEventListener('message', (event) => {
      const raw = typeof event.data === 'string' ? event.data : ''
      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch {
        client.send(JSON.stringify({ type: 'error', detail: '올바르지 않은 메시지 형식입니다.' } satisfies DmWsServerMessage))
        return
      }

      if (typeof parsed !== 'object' || parsed === null) {
        client.send(JSON.stringify({ type: 'error', detail: '올바르지 않은 메시지 형식입니다.' } satisfies DmWsServerMessage))
        return
      }

      const msg = parsed as { type?: unknown; token?: unknown; conversation_id?: unknown; content?: unknown }

      if (msg.type === 'auth') {
        if (typeof msg.token !== 'string' || msg.token.length === 0) {
          client.send(JSON.stringify({ type: 'error', detail: '인증에 실패했습니다.' } satisfies DmWsServerMessage))
          client.close()
          clearTimeout(timeoutId)
          return
        }
        authedClients.add(client)
        clearTimeout(timeoutId)
        return
      }

      if (!authedClients.has(client)) {
        client.send(JSON.stringify({ type: 'error', detail: '인증이 필요합니다.' } satisfies DmWsServerMessage))
        return
      }

      if (msg.type === 'send_message') {
        if (typeof msg.conversation_id !== 'string' || typeof msg.content !== 'string' || msg.content.trim() === '') {
          client.send(JSON.stringify({ type: 'error', detail: '올바르지 않은 메시지 형식입니다.' } satisfies DmWsServerMessage))
          return
        }

        const convId = msg.conversation_id
        const messages = messageStore.get(convId)
        if (!messages) {
          client.send(JSON.stringify({ type: 'error', detail: '존재하지 않는 대화방입니다.' } satisfies DmWsServerMessage))
          return
        }

        const now = new Date().toISOString()
        const newMessage: Message = {
          message_id: createMessageId(),
          sender: ME,
          content: msg.content.trim(),
          img_url: null,
          original_img: null,
          is_deleted: false,
          created_at: now,
        }
        messages.unshift(newMessage)

        const conv = conversations.find((c) => c.conversation_id === convId)
        if (conv) {
          conv.last_message = { content: newMessage.content, img_url: '', created_at: now } satisfies LastMessage
        }

        // C3: 해당 대화방을 구독 중인 클라이언트에게만 브로드캐스트
        const subs = clientConversations.get(client) ?? new Set<string>()
        subs.add(convId)
        clientConversations.set(client, subs)

        const payload = JSON.stringify({ type: 'receive_message', message: newMessage } satisfies DmWsServerMessage)
        for (const [c, convIds] of clientConversations) {
          if (convIds.has(convId)) c.send(payload)
        }
        return
      }

      client.send(JSON.stringify({ type: 'error', detail: '알 수 없는 메시지 타입입니다.' } satisfies DmWsServerMessage))
    })

    // C8: 연결 종료 시 모든 추적 자료구조에서 제거해 stale 참조 누출 방지
    client.addEventListener('close', () => {
      clearTimeout(timeoutId)
      authedClients.delete(client)
      clientConversations.delete(client)
    })
  }),
]
