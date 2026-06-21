/**
 * DM Mock 핸들러.
 * - POST   *\/direct-messages/conversations                                  대화방 생성 (이미 있으면 기존 반환)
 * - GET    *\/direct-messages/conversations                                  대화방 목록
 * - DELETE *\/direct-messages/conversations/:conversation_id                 대화방 나가기
 * - POST   *\/direct-messages/conversations/:conversation_id/messages/presigned-url  이미지 presigned URL 발급
 * - DELETE *\/direct-messages/conversations/:conversation_id/messages/:message_id    메시지 삭제
 * - GET    *\/direct-messages/conversations/:conversation_id/messages        메시지 목록 (cursor 페이지네이션, 최신순)
 * - WS     *\/ws/conversations/:conversation_id                              실시간 메시지 송수신
 */
import { http, HttpResponse, passthrough, ws } from 'msw'
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

/** mock 내부 전용 타입 — Conversation 외에 정렬·POST 응답 생성용 created_at 보관 */
type StoredConversation = Conversation & { created_at: string }

const NOW = Date.UTC(2026, 5, 17, 12, 0, 0) // 2026-06-17 12:00:00Z 기준

const OPPONENTS: Conversation['opponent'][] = [
  { user_id: '01HDMPARTNER0000000000001', nickname: '김다님', profile_img: 'https://picsum.photos/seed/dmp1/96/96' },
  { user_id: '01HDMPARTNER0000000000002', nickname: '박여행', profile_img: 'https://picsum.photos/seed/dmp2/96/96' },
  { user_id: '01HDMPARTNER0000000000003', nickname: '이바다', profile_img: null },
]

const conversations: StoredConversation[] = [
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

/**
 * mock 데이터가 존재하는 대화방인지 확인한다.
 * mock 대화방 ID만 MSW가 처리하고, 실제 API 대화방 ID는 passthrough한다.
 */
const isMockConv = (convId: string): boolean => messageStore.has(convId)

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
    const newConv: StoredConversation = {
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

    // last_message 없는 신규 대화방은 최상단으로 (먼 미래 날짜로 폴백)
    const sorted = [...conversations].sort((a, b) => {
      const ta = a.last_message?.created_at ?? '9999-12-31T23:59:59.999Z'
      const tb = b.last_message?.created_at ?? '9999-12-31T23:59:59.999Z'
      return tb.localeCompare(ta)
    })

    return HttpResponse.json({ results: sorted } satisfies ConversationListResponse)
  }),

  // 대화방 나가기
  http.delete('*/direct-messages/conversations/:conversation_id', ({ request, params }) => {
    if (!isAuthed(request)) return unauthorized()
    const convId = params.conversation_id as string
    // 실제 API 대화방은 실제 서버로 통과
    if (!isMockConv(convId)) return passthrough()

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
    // 실제 API 대화방은 실제 서버로 통과
    if (!isMockConv(convId)) return passthrough()

    const mockKey = `dm/${convId}/${Date.now()}.jpg`
    const res: DmPresignedUrlResponse = {
      presigned_url: `https://oz-externship.s3.ap-northeast-2.amazonaws.com/${mockKey}?X-Amz-Signature=mock`,
      img_url: `https://picsum.photos/seed/${Date.now()}/300/300`,
      key: mockKey,
    }
    return HttpResponse.json(res, { status: 201 })
  }),

  // S3 presigned URL PUT 요청 — mock 대화방 이미지 업로드 시 실제 S3 요청을 막고 200 반환
  // *.amazonaws.com 은 URLPattern 에서 단일 레벨 서브도메인만 매칭하므로 실제 버킷 호스트를 명시한다
  http.put('https://oz-externship.s3.ap-northeast-2.amazonaws.com/*', () => new HttpResponse(null, { status: 200 })),

  // 메시지 삭제
  http.delete('*/direct-messages/conversations/:conversation_id/messages/:message_id', ({ request, params }) => {
    if (!isAuthed(request)) return unauthorized()
    const convId = params.conversation_id as string
    const msgId = params.message_id as string
    // 실제 API 대화방은 실제 서버로 통과
    if (!isMockConv(convId)) return passthrough()

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
    // 실제 API 대화방은 실제 서버로 통과
    if (!isMockConv(convId)) return passthrough()

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

const dmWs = ws.link('*/ws/conversations/:conversation_id')

// C3: 클라이언트가 메시지를 전송한 대화방 ID를 추적해 해당 대화방 참여자에게만 브로드캐스트
const clientConversations = new Map<WsClient, Set<string>>()

export const dmWsHandlers: WebSocketHandler[] = [
  dmWs.addEventListener('connection', ({ client }) => {
    // 비mock 대화방은 핸들러 연결 없이 반환 — MSW WebSocket client에는 passthrough()가 없음
    const convId = client.url.pathname.split('/').pop() ?? ''
    if (!isMockConv(convId)) return

    // socket_key URL 파라미터 검증 (mock: 존재 여부만 확인)
    const socketKey = client.url.searchParams.get('socket_key')
    if (!socketKey) {
      client.send(JSON.stringify({ type: 'error', detail: '인증에 실패했습니다.' } satisfies DmWsServerMessage))
      client.close()
      return
    }

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

      const msg = parsed as {
        type?: unknown
        conversation_id?: unknown
        content?: unknown
        img_url?: unknown
        original_img?: unknown
      }

      if (msg.type === 'send_message') {
        const content = typeof msg.content === 'string' ? msg.content.trim() : null
        const originalImg = typeof msg.original_img === 'string' && msg.original_img ? msg.original_img : null
        // original_img(key)가 있으면 mock CDN URL 생성 — 서버가 key로 CDN URL을 만드는 것과 동일
        const imgUrl = originalImg
          ? `https://picsum.photos/seed/${originalImg}/300/300`
          : (typeof msg.img_url === 'string' && msg.img_url ? msg.img_url : null)
        if (typeof msg.conversation_id !== 'string' || (!content && !imgUrl)) {
          client.send(JSON.stringify({ type: 'error', detail: '올바르지 않은 메시지 형식입니다.' } satisfies DmWsServerMessage))
          return
        }

        const msgConvId = msg.conversation_id
        const messages = messageStore.get(msgConvId)
        if (!messages) {
          client.send(JSON.stringify({ type: 'error', detail: '존재하지 않는 대화방입니다.' } satisfies DmWsServerMessage))
          return
        }

        const now = new Date().toISOString()
        const newMessage: Message = {
          message_id: createMessageId(),
          sender: ME,
          content,
          img_url: imgUrl,
          original_img: originalImg,
          is_deleted: false,
          created_at: now,
        }
        messages.unshift(newMessage)

        const conv = conversations.find((c) => c.conversation_id === msgConvId)
        if (conv) {
          conv.last_message = { content: newMessage.content, img_url: newMessage.img_url ?? '', created_at: now } satisfies LastMessage
        }

        // C3: 해당 대화방을 구독 중인 클라이언트에게만 브로드캐스트
        const subs = clientConversations.get(client) ?? new Set<string>()
        subs.add(msgConvId)
        clientConversations.set(client, subs)

        const payload = JSON.stringify({ type: 'receive_message', message: newMessage } satisfies DmWsServerMessage)
        for (const [c, convIds] of clientConversations) {
          if (convIds.has(msgConvId)) c.send(payload)
        }
        return
      }

      client.send(JSON.stringify({ type: 'error', detail: '알 수 없는 메시지 타입입니다.' } satisfies DmWsServerMessage))
    })

    // C8: 연결 종료 시 모든 추적 자료구조에서 제거해 stale 참조 누출 방지
    client.addEventListener('close', () => {
      clientConversations.delete(client)
    })
  }),
]
