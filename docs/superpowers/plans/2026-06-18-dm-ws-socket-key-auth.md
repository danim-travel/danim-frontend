# DM WebSocket socket_key 인증 전환 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** DM WebSocket 인증을 `token` WS 메시지 방식에서 `socket_key` URL 파라미터 방식으로 전환해 알림 WS와 동일한 패턴으로 통일한다.

**Architecture:** `issueSocketKey()`로 일회성 키 발급 → `wss://.../ws/conversations/{id}?socket_key=<uuid>` URL로 연결 → `onopen` 시점에 바로 ready. WS 메시지 레벨의 auth 핸드셰이크 제거.

**Tech Stack:** Next.js 15 / React 19 / TypeScript / MSW v2 / TanStack Query v5

---

## 변경 파일 맵

| 파일 | 변경 종류 | 핵심 변경 내용 |
|---|---|---|
| `src/types/dm.types.ts` | Modify | `DmWsClientMessage`에서 `auth` variant 제거, `DmWsServerMessage`에서 `auth_success` 제거 |
| `src/hooks/useDmSocket.ts` | Modify | `accessToken` 파라미터 제거 → store에서 읽음, `connect()` async화, socket_key URL 추가, `isAuthedRef` 제거, `auth_success` 핸들러 제거 |
| `src/app/(main)/dm/_components/ChatRoom.tsx` | Modify | `useDmSocket` 호출에서 `accessToken` 인수 제거 |
| `src/mocks/handlers/dm.ts` | Modify | WS 핸들러에서 auth 메시지 처리 제거 → URL의 `socket_key` 파라미터 존재 여부로 대체 |

---

## Task 1: 타입 업데이트 (`dm.types.ts`)

**Files:**
- Modify: `src/types/dm.types.ts`

- [ ] **Step 1: `DmWsClientMessage`에서 `auth` variant 제거, `DmWsServerMessage`에서 `auth_success` 제거**

```typescript
// src/types/dm.types.ts — 65~79줄 교체

/**
 * DM WebSocket 메시지 타입.
 * 클라이언트 → 서버: send_message로 메시지 전송 (인증은 URL ?socket_key= 로 처리).
 * 서버 → 클라이언트: receive_message / read_receipt / message_deleted / error.
 */
export type DmWsClientMessage =
  | { type: 'send_message'; conversation_id: string; content: string | null; img_url?: string | null }

export type DmWsServerMessage =
  | { type: 'receive_message'; message: Message }
  | { type: 'read_receipt'; conversation_id: string; message_id: string }
  | { type: 'message_deleted'; conversation_id: string; message_id: string }
  | { type: 'error'; detail: string }
```

- [ ] **Step 2: 타입 체크**

```bash
pnpm type-check 2>&1 | grep "^src/"
```
Expected: 에러 출력 없음 (타입 참조 오류가 있다면 다음 태스크에서 해결)

---

## Task 2: `useDmSocket` hook 리팩토링

**Files:**
- Modify: `src/hooks/useDmSocket.ts`

- [ ] **Step 1: import 추가 및 함수 시그니처 변경**

파일 상단 import 블록을 아래로 교체:
```typescript
'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { config } from '@/lib/config'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/store/authStore'
import { issueSocketKey } from '@/lib/api/websocket'
import type { Message, MessageListResponse, DmWsClientMessage, DmWsServerMessage } from '@/types'
```

함수 시그니처 변경 (accessToken 파라미터 제거, store에서 읽음):
```typescript
export function useDmSocket(
  conversationId: string,
  myUserId: string | null
) {
  const queryClient = useQueryClient()
  const accessToken = useAuthStore(s => s.accessToken)
  const socketRef = useRef<WebSocket | null>(null)
  // isAuthedRef 제거 (socket_key URL 인증이므로 연결 = 인증됨)
  const pendingRef = useRef<PendingEntry[]>([])
  const skippedSocketWarningRef = useRef<string | null>(null)
  const isMockModeRef = useRef(false)
  const [isReady, setIsReady] = useState(false)
```

- [ ] **Step 2: `isDmWsServerMessage` 타입 가드에서 `auth_success` 제거**

```typescript
function isDmWsServerMessage(value: unknown): value is DmWsServerMessage {
  if (typeof value !== 'object' || value === null) return false
  const v = value as { type?: unknown }
  return (
    v.type === 'receive_message' ||
    v.type === 'read_receipt' ||
    v.type === 'message_deleted' ||
    v.type === 'error'
  )
}
```

- [ ] **Step 3: `connect()`를 `async`로 변경 — socket_key 발급 후 URL에 추가**

기존 `connect()` 함수를 아래로 교체:
```typescript
const connect = async () => {
  if (cancelled) return
  pendingRef.current = []

  // 1) socket_key 발급
  let socketKey: string
  try {
    const { socket_key } = await issueSocketKey()
    socketKey = socket_key
  } catch {
    console.warn('[DM WebSocket] socket_key 발급 실패, 재연결 예약')
    scheduleReconnect()
    return
  }
  if (cancelled) return

  // 2) socket_key를 URL 파라미터로 전달
  const wsUrl = `${config.wsBaseUrl}/ws/conversations/${conversationId}?socket_key=${encodeURIComponent(socketKey)}`
  try {
    console.info(`[DM WebSocket] connecting: ${config.wsBaseUrl}/ws/conversations/${conversationId}`)
    socket = new WebSocket(wsUrl)
    socketRef.current = socket
  } catch {
    console.error('[DM WebSocket] connect failed before opening')
    scheduleReconnect()
    return
  }

  socket.onopen = () => {
    console.info('[DM WebSocket] open')
    // URL 인증이므로 auth 메시지 전송 불필요 → 바로 ready
    setIsReady(true)
    backoffMs = INITIAL_BACKOFF_MS
  }

  // onmessage, onclose, onerror는 기존과 동일
  // ...
}
```

- [ ] **Step 4: `scheduleReconnect` 내 `connect()` 호출을 `void connect()`로 변경**

```typescript
const scheduleReconnect = () => {
  if (cancelled) return
  clearReconnectTimer()
  const delay = backoffMs
  backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS)
  reconnectTimerId = setTimeout(() => {
    if (cancelled) return
    void connect()  // async이므로 void로 호출
  }, delay)
}
```

effect 내 첫 connect 호출도 변경:
```typescript
void connect()
```

- [ ] **Step 5: `onmessage`에서 `auth_success` 핸들러 제거**

`socket.onmessage` 내부에서 아래 블록 삭제:
```typescript
// 삭제할 블록
if (parsed.type === 'auth_success') {
  isAuthedRef.current = true
  setIsReady(true)
  return
}
```

- [ ] **Step 6: `sendMessage`에서 `isAuthedRef.current` 가드 제거**

```typescript
// 변경 전
if (!socket || socket.readyState !== WebSocket.OPEN || !isAuthedRef.current) {
  console.warn('[DM WebSocket] send skipped: socket is not ready', {
    readyState: socket?.readyState,
    isAuthed: isAuthedRef.current,
    conversationId,
  })
  return false
}

// 변경 후
if (!socket || socket.readyState !== WebSocket.OPEN) {
  console.warn('[DM WebSocket] send skipped: socket is not ready', {
    readyState: socket?.readyState,
    conversationId,
  })
  return false
}
```

- [ ] **Step 7: 타입 체크**

```bash
pnpm type-check 2>&1 | grep "^src/"
```
Expected: 에러 없음

---

## Task 3: ChatRoom 호출부 업데이트

**Files:**
- Modify: `src/app/(main)/dm/_components/ChatRoom.tsx`

- [ ] **Step 1: `accessToken` 제거 및 `useDmSocket` 인수 변경**

```typescript
// 삭제할 줄
const accessToken = useAuthStore(s => s.accessToken)

// 변경 전
const { sendMessage, isReady } = useDmSocket(conversationId, accessToken, myUserId ?? null)

// 변경 후
const { sendMessage, isReady } = useDmSocket(conversationId, myUserId ?? null)
```

`useAuthStore` import가 `myUserId`에만 쓰인다면 유지, `accessToken`에만 쓰였다면 제거.

- [ ] **Step 2: 타입 체크 + 린트**

```bash
pnpm type-check 2>&1 | grep "^src/" && pnpm lint "src/app/(main)/dm/_components/ChatRoom.tsx"
```
Expected: 에러/경고 없음

---

## Task 4: MSW mock WS 핸들러 업데이트 (`dm.ts`)

**Files:**
- Modify: `src/mocks/handlers/dm.ts`

- [ ] **Step 1: `AUTH_TIMEOUT_MS`, `authedClients` 제거 및 connection 핸들러를 socket_key 방식으로 교체**

WS 핸들러 전체를 아래로 교체 (기존 `dmWsHandlers` export):

```typescript
// ---------- WebSocket ----------

const dmWs = ws.link('*/ws/conversations/:conversation_id/')

// socket_key 기반 인증: 연결 URL에 ?socket_key=<uuid> 포함 여부만 확인
// C3: 클라이언트가 메시지를 전송한 대화방 ID를 추적해 해당 대화방 참여자에게만 브로드캐스트
const clientConversations = new Map<WsClient, Set<string>>()

export const dmWsHandlers: WebSocketHandler[] = [
  dmWs.addEventListener('connection', ({ client }) => {
    // socket_key URL 파라미터 검증
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

      const msg = parsed as { type?: unknown; conversation_id?: unknown; content?: unknown; img_url?: unknown }

      if (msg.type === 'send_message') {
        const content = typeof msg.content === 'string' ? msg.content.trim() : null
        const imgUrl = typeof msg.img_url === 'string' && msg.img_url ? msg.img_url : null
        if (typeof msg.conversation_id !== 'string' || (!content && !imgUrl)) {
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
          content: content ?? null,
          img_url: imgUrl,
          original_img: null,
          is_deleted: false,
          created_at: now,
        }
        messages.unshift(newMessage)

        const conv = conversations.find((c) => c.conversation_id === convId)
        if (conv) {
          conv.last_message = {
            content: newMessage.content,
            img_url: newMessage.img_url,
            created_at: now,
          } satisfies LastMessage
        }

        // 해당 대화방 구독 클라이언트에게만 브로드캐스트
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

    // C8: 연결 종료 시 추적 자료구조 정리
    client.addEventListener('close', () => {
      clientConversations.delete(client)
    })
  }),
]
```

- [ ] **Step 2: 린트 + 타입 체크**

```bash
pnpm type-check 2>&1 | grep "^src/" && pnpm lint "src/mocks/handlers/dm.ts"
```
Expected: 에러/경고 없음

---

## Task 5: 최종 검증 및 커밋

- [ ] **Step 1: 전체 타입 체크**

```bash
pnpm type-check 2>&1 | grep "^src/"
```
Expected: 출력 없음

- [ ] **Step 2: 전체 린트**

```bash
pnpm lint "src/types/dm.types.ts" "src/hooks/useDmSocket.ts" "src/app/(main)/dm/_components/ChatRoom.tsx" "src/mocks/handlers/dm.ts"
```
Expected: 에러/경고 없음

- [ ] **Step 3: 커밋**

```bash
git add src/types/dm.types.ts src/hooks/useDmSocket.ts "src/app/(main)/dm/_components/ChatRoom.tsx" src/mocks/handlers/dm.ts
git commit -m "refactor: DM WebSocket 인증을 socket_key URL 파라미터 방식으로 전환

- accessToken WS 메시지 인증 제거 → ?socket_key= URL 파라미터로 통일
- useDmSocket에서 accessToken 파라미터 제거 (store에서 직접 읽음)
- connect()를 async로 변경 (issueSocketKey 호출)
- isAuthedRef 및 auth_success 핸들러 제거
- MSW mock WS 핸들러를 socket_key URL 검증 방식으로 업데이트
- 알림 WS (useNotificationBadge)와 동일한 인증 패턴 적용"
```

- [ ] **Step 4: 푸시**

```bash
git push
```
