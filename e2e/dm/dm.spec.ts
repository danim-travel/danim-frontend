/**
 * DM(채팅) E2E 테스트
 *
 * @interface-contract
 *   API:
 *     - POST   v1/users/token/refresh
 *     - GET    v1/users/me
 *     - GET    v1/users/:userId/following
 *     - POST   v1/direct-messages/conversations
 *     - GET    v1/direct-messages/conversations
 *     - GET    v1/direct-messages/conversations/:conversationId/messages
 *     - DELETE v1/direct-messages/conversations/:conversationId/messages/:messageId
 *   WS:
 *     - mock conversation_id에서는 실제 WebSocket 연결을 시도하지 않음
 *
 * 검증 항목:
 *   1. 채팅방 목록 렌더링 / 검색 / 빈 검색 결과
 *   2. 새 대화 모달에서 팔로잉 사용자 선택 → 채팅방 생성 API 호출 → 방으로 이동
 *   3. 방 입장 후 헤더·기존 메시지 렌더링
 *   4. MSW mock 대화방에서는 WebSocket 미연결, 입력 가능, 전송 실패 시 입력 유지
 *   5. 내 메시지 삭제 성공/실패 흐름
 */

import { test, expect, type Page } from '@playwright/test'

type CapturedRequest = { url: string; method: string; body: string | null }

const MOCK_USER_ID = '01KSSJE3FZQ0G042AS5J7AJVK6'
const FIRST_CONVERSATION_ID = '01HDMCONV000000000000001'
const FIRST_OPPONENT_ID = '01HDMPARTNER0000000000001'

// 삭제 테스트 픽스처 — mock 대화방에서 내가 보낸 메시지 (sender: ME)
const MY_MESSAGE_ID = '01HDMMSG000000000000003'
const MY_MESSAGE_CONTENT = '저도 가고 싶어요.'
// 상대방이 보낸 메시지 (삭제 불가)
const OPPONENT_MESSAGE_CONTENT = '제주도 어땠어요?'

async function bootstrapAuthedDmPage(page: Page) {
  await page.addInitScript({
    content: `
      (() => {
        const orig = window.fetch.bind(window);
        const origWarn = window.console.warn.bind(window.console);
        const OriginalWebSocket = window.WebSocket;
        window.__fetchCaptures = [];
        window.__wsCaptures = [];
        window.__warnCaptures = [];

        window.WebSocket = class extends OriginalWebSocket {
          constructor(url, protocols) {
            window.__wsCaptures.push(String(url));
            super(url, protocols);
          }
        };

        window.console.warn = (...args) => {
          window.__warnCaptures.push(args.map(String).join(' '));
          origWarn(...args);
        };

        window.fetch = async (input, init) => {
          const url = input instanceof Request ? input.url : String(input);
          const method = input instanceof Request ? input.method : (init?.method ?? 'GET');

          let body = null;
          try {
            if (input instanceof Request && input.body !== null) {
              body = await input.clone().text();
            } else if (typeof init?.body === 'string') {
              body = init.body;
            }
          } catch {}

          window.__fetchCaptures.push({ url, method, body });

          if (url.includes('/users/token/refresh') && method === 'POST') {
            return new Response(
              JSON.stringify({ access_token: 'mock_access_token' }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }

          if (url.includes('/users/me') && method === 'GET') {
            return new Response(
              JSON.stringify({
                user_id: '${MOCK_USER_ID}',
                email: 'test@test.com',
                nickname: '다님유저',
                profile_img: null,
                role: 'user'
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }

          if (/\\/users\\/[^/]+\\/following\\/?$/.test(new URL(url).pathname) && method === 'GET') {
            return new Response(
              JSON.stringify({
                results: [
                  {
                    user_id: '${FIRST_OPPONENT_ID}',
                    nickname: '김다님',
                    profile_img: 'https://picsum.photos/seed/dmp1/96/96',
                    is_following: true
                  },
                  {
                    user_id: '01HDMPARTNER0000000000002',
                    nickname: '박여행',
                    profile_img: 'https://picsum.photos/seed/dmp2/96/96',
                    is_following: true
                  }
                ]
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }

          return orig(input, init);
        };
      })();
    `,
  })
}

async function getCaptures(page: Page): Promise<CapturedRequest[]> {
  return page.evaluate(
    () => (window as Window & { __fetchCaptures?: CapturedRequest[] }).__fetchCaptures ?? [],
  )
}

async function getWsCaptures(page: Page): Promise<string[]> {
  return page.evaluate(
    () => (window as Window & { __wsCaptures?: string[] }).__wsCaptures ?? [],
  )
}

async function getWarnCaptures(page: Page): Promise<string[]> {
  return page.evaluate(
    () => (window as Window & { __warnCaptures?: string[] }).__warnCaptures ?? [],
  )
}

async function gotoDm(page: Page) {
  await bootstrapAuthedDmPage(page)
  await page.goto('/dm')
  await expect(page.getByRole('button', { name: /김다님/ })).toBeVisible({ timeout: 15000 })
}

async function openFirstConversation(page: Page) {
  await gotoDm(page)
  await page.getByRole('button', { name: /김다님/ }).click()
  await expect(page).toHaveURL(`/dm/${FIRST_CONVERSATION_ID}`)
  await expect(page.getByText('제주도 어땠어요?').last()).toBeVisible({ timeout: 15000 })
}

test.describe('DM — 채팅방 목록', () => {
  test('대화 목록에 상대 닉네임, 마지막 메시지, 읽지 않은 수가 표시된다', async ({ page }) => {
    await gotoDm(page)

    const firstRoom = page.getByRole('button', { name: /김다님/ })
    await expect(firstRoom).toContainText('김다님')
    await expect(firstRoom).toContainText('제주도 어땠어요?')
    await expect(firstRoom).toContainText('2')

    await expect(page.getByRole('button', { name: /박여행/ })).toContainText('다음 여행지는 어디예요?')
    await expect(page.getByRole('button', { name: /이바다/ })).toContainText('안녕하세요!')
  })

  test('검색어로 대화 목록을 필터링하고 결과 없음 상태를 표시한다', async ({ page }) => {
    await gotoDm(page)

    const search = page.getByPlaceholder('검색')
    await search.fill('바다')
    await expect(page.getByRole('button', { name: /이바다/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /김다님/ })).toBeHidden()

    await search.fill('없는대화')
    await expect(page.getByText('검색 결과가 없어요')).toBeVisible()
  })

  test('대화방을 클릭하면 해당 채팅방으로 이동한다', async ({ page }) => {
    await gotoDm(page)

    await page.getByRole('button', { name: /김다님/ }).click()

    await expect(page).toHaveURL(`/dm/${FIRST_CONVERSATION_ID}`)
    await expect(page.getByText('김다님').last()).toBeVisible()
    await expect(page.getByText('제주도 어땠어요?').last()).toBeVisible()
  })
})

test.describe('DM — 채팅방 생성', () => {
  test('새 대화에서 팔로잉 사용자를 선택하면 생성 API를 호출하고 채팅방으로 이동한다', async ({ page }) => {
    await gotoDm(page)

    await page.getByRole('button', { name: '새 대화' }).click()
    const dialog = page.getByRole('dialog', { name: '새 대화' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('김다님')).toBeVisible()

    await dialog.getByText('김다님').click()

    await expect(page).toHaveURL(`/dm/${FIRST_CONVERSATION_ID}`)
    await expect(dialog).toBeHidden()
    await expect(page.getByText('제주도 어땠어요?').last()).toBeVisible({ timeout: 15000 })

    const captures = await getCaptures(page)
    const createRequest = captures.find(
      (c) => new URL(c.url).pathname.endsWith('/direct-messages/conversations') && c.method === 'POST',
    )
    expect(createRequest).toBeTruthy()
    expect(JSON.parse(createRequest?.body ?? '{}')).toEqual({ receiver_id: FIRST_OPPONENT_ID })
  })

  test('새 대화 모달 검색은 팔로잉 목록을 필터링한다', async ({ page }) => {
    await gotoDm(page)

    await page.getByRole('button', { name: '새 대화' }).click()
    const dialog = page.getByRole('dialog', { name: '새 대화' })
    await dialog.getByPlaceholder('닉네임으로 검색...').fill('박')

    await expect(dialog.getByText('박여행')).toBeVisible()
    await expect(dialog.getByText('김다님')).toBeHidden()

    await dialog.getByPlaceholder('닉네임으로 검색...').fill('unknown')
    await expect(dialog.getByText('검색 결과가 없어요')).toBeVisible()
  })
})

test.describe('DM — 채팅방 대화', () => {
  test('채팅방에 들어가면 헤더와 기존 메시지들이 시간순으로 표시된다', async ({ page }) => {
    await openFirstConversation(page)

    await expect(page.getByText('안녕하세요!').last()).toBeVisible()
    await expect(page.getByText('저 지금 제주도예요.')).toBeVisible()
    await expect(page.getByText('저도 가고 싶어요.')).toBeVisible()
    await expect(page.getByText('사진 올려줘요!')).toBeVisible()
    await expect(page.getByText('제주도 어땠어요?').last()).toBeVisible()

    const captures = await getCaptures(page)
    expect(captures.some(
      (c) =>
        c.method === 'GET' &&
        c.url.includes(`/direct-messages/conversations/${FIRST_CONVERSATION_ID}/messages`) &&
        c.url.includes('page_size=20'),
    )).toBe(true)
  })

  test('mock 대화방에서는 WebSocket 연결을 시도하지 않는다', async ({ page }) => {
    await openFirstConversation(page)

    const wsCaptures = await getWsCaptures(page)
    expect(wsCaptures.some(url => url.includes('/ws/conversations/'))).toBe(false)

    const warnings = await getWarnCaptures(page)
    expect(warnings.some(message => message.includes('Mock DM data detected'))).toBe(true)
  })

  test('mock 대화방에서는 입력과 이모지 선택이 가능하고 전송 실패 시 입력을 유지한다', async ({ page }) => {
    await openFirstConversation(page)

    const input = page.getByPlaceholder('메시지 입력...')
    const sendButton = page.getByRole('button', { name: '전송', exact: true })
    const imageButton = page.getByRole('button', { name: '이미지 전송' })

    await expect(input).toBeEnabled({ timeout: 15000 })
    await expect(imageButton).toBeDisabled()
    await page.getByRole('button', { name: '이모지' }).click()
    await page.getByRole('button', { name: '😀' }).click()
    await expect(input).toHaveValue('😀')
    await expect(sendButton).toBeEnabled()
    await sendButton.click()
    await expect(input).toHaveValue('😀')
  })

  test('mock ID warning에는 conversation_id가 포함된다', async ({ page }) => {
    await openFirstConversation(page)

    const warnings = await getWarnCaptures(page)
    expect(warnings.some(message => message.includes(FIRST_CONVERSATION_ID))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 삭제 실패 시뮬레이션용 bootstrap
// window.fetch 오버라이드에서 DELETE /messages/* 요청을 500으로 가로챈다.
// MSW 서비스 워커보다 앞선 JS 레벨 오버라이드이므로 MSW에 도달하기 전에 처리된다.
// ---------------------------------------------------------------------------
async function bootstrapAuthedDmPageWithDeleteFailure(page: Page) {
  await page.addInitScript({
    content: `
      (() => {
        const orig = window.fetch.bind(window);
        const origWarn = window.console.warn.bind(window.console);
        const OriginalWebSocket = window.WebSocket;
        window.__fetchCaptures = [];
        window.__wsCaptures = [];
        window.__warnCaptures = [];

        window.WebSocket = class extends OriginalWebSocket {
          constructor(url, protocols) {
            window.__wsCaptures.push(String(url));
            super(url, protocols);
          }
        };

        window.console.warn = (...args) => {
          window.__warnCaptures.push(args.map(String).join(' '));
          origWarn(...args);
        };

        window.fetch = async (input, init) => {
          const url = input instanceof Request ? input.url : String(input);
          const method = input instanceof Request ? input.method : (init?.method ?? 'GET');

          let body = null;
          try {
            if (input instanceof Request && input.body !== null) {
              body = await input.clone().text();
            } else if (typeof init?.body === 'string') {
              body = init.body;
            }
          } catch {}

          window.__fetchCaptures.push({ url, method, body });

          if (url.includes('/users/token/refresh') && method === 'POST') {
            return new Response(
              JSON.stringify({ access_token: 'mock_access_token' }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }

          if (url.includes('/users/me') && method === 'GET') {
            return new Response(
              JSON.stringify({
                user_id: '${MOCK_USER_ID}',
                email: 'test@test.com',
                nickname: '다님유저',
                profile_img: null,
                role: 'user'
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }

          if (/\\/users\\/[^/]+\\/following\\/?$/.test(new URL(url).pathname) && method === 'GET') {
            return new Response(
              JSON.stringify({
                results: [
                  {
                    user_id: '${FIRST_OPPONENT_ID}',
                    nickname: '김다님',
                    profile_img: 'https://picsum.photos/seed/dmp1/96/96',
                    is_following: true
                  }
                ]
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }

          // DELETE 메시지 요청 — 서버 오류 시뮬레이션
          if (method === 'DELETE' && url.includes('/messages/')) {
            return new Response(
              JSON.stringify({ error_detail: '메시지를 삭제할 수 없습니다.' }),
              { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
          }

          return orig(input, init);
        };
      })();
    `,
  })
}

async function openFirstConversationWithDeleteFailure(page: Page) {
  await bootstrapAuthedDmPageWithDeleteFailure(page)
  await page.goto('/dm')
  await expect(page.getByRole('button', { name: /김다님/ })).toBeVisible({ timeout: 15000 })
  await page.getByRole('button', { name: /김다님/ }).click()
  await expect(page).toHaveURL(`/dm/${FIRST_CONVERSATION_ID}`)
  await expect(page.getByText(MY_MESSAGE_CONTENT)).toBeVisible({ timeout: 15000 })
}

// ---------------------------------------------------------------------------
// 삭제 흐름 헬퍼
// ---------------------------------------------------------------------------
async function openDeleteDropdown(page: Page) {
  await page.getByText(MY_MESSAGE_CONTENT).click()
  await expect(page.getByRole('button', { name: '삭제', exact: true })).toBeVisible()
}

async function openDeleteModal(page: Page) {
  await openDeleteDropdown(page)
  await page.getByRole('button', { name: '삭제', exact: true }).click()
  await expect(page.getByRole('dialog', { name: '메시지 삭제' })).toBeVisible()
}

// ---------------------------------------------------------------------------
// 삭제 테스트
// ---------------------------------------------------------------------------
test.describe('DM — 메시지 삭제', () => {
  test('내 메시지를 클릭하면 삭제 드롭다운이 표시된다', async ({ page }) => {
    await openFirstConversation(page)

    await page.getByText(MY_MESSAGE_CONTENT).click()

    await expect(page.getByRole('button', { name: '삭제', exact: true })).toBeVisible()
  })

  test('드롭다운 삭제 클릭 시 확인 모달이 표시된다', async ({ page }) => {
    await openFirstConversation(page)
    await openDeleteDropdown(page)

    await page.getByRole('button', { name: '삭제', exact: true }).click()

    const modal = page.getByRole('dialog', { name: '메시지 삭제' })
    await expect(modal).toBeVisible()
    await expect(modal.getByText('메시지를 삭제하시겠습니까?')).toBeVisible()
    await expect(modal.getByRole('button', { name: '취소' })).toBeVisible()
    await expect(modal.getByRole('button', { name: '삭제' })).toBeVisible()
  })

  test('확인 모달에서 취소하면 모달이 닫히고 메시지가 유지된다', async ({ page }) => {
    await openFirstConversation(page)
    await openDeleteModal(page)

    const modal = page.getByRole('dialog', { name: '메시지 삭제' })
    await modal.getByRole('button', { name: '취소' }).click()

    await expect(modal).toBeHidden()
    await expect(page.getByText(MY_MESSAGE_CONTENT)).toBeVisible()
  })

  test('삭제 확인 즉시 낙관적으로 "삭제된 메시지입니다."가 표시된다', async ({ page }) => {
    await openFirstConversation(page)
    await openDeleteModal(page)

    const modal = page.getByRole('dialog', { name: '메시지 삭제' })
    await modal.getByRole('button', { name: '삭제' }).click()

    // 낙관적 업데이트: API 응답 전에 즉시 반영
    await expect(page.getByText('삭제된 메시지입니다.').first()).toBeVisible({ timeout: 3000 })
    await expect(page.getByText(MY_MESSAGE_CONTENT)).toBeHidden()
  })

  test('삭제 확인 클릭 시 모달이 즉시 닫힌다', async ({ page }) => {
    await openFirstConversation(page)
    await openDeleteModal(page)

    const modal = page.getByRole('dialog', { name: '메시지 삭제' })
    await modal.getByRole('button', { name: '삭제' }).click()

    await expect(modal).toBeHidden({ timeout: 3000 })
  })

  test('삭제 성공 시 DELETE API가 올바른 conversationId·messageId로 호출된다', async ({ page }) => {
    await openFirstConversation(page)
    await openDeleteModal(page)

    const modal = page.getByRole('dialog', { name: '메시지 삭제' })
    await modal.getByRole('button', { name: '삭제' }).click()

    await expect(page.getByText('삭제된 메시지입니다.').first()).toBeVisible({ timeout: 5000 })

    const captures = await getCaptures(page)
    const deleteReq = captures.find(
      (c) =>
        c.method === 'DELETE' &&
        c.url.includes(`/direct-messages/conversations/${FIRST_CONVERSATION_ID}/messages/`) &&
        c.url.includes(MY_MESSAGE_ID),
    )
    expect(deleteReq).toBeTruthy()
  })

  test('삭제 API 실패 시 낙관적 업데이트가 롤백되어 메시지가 복구된다', async ({ page }) => {
    await openFirstConversationWithDeleteFailure(page)
    await openDeleteModal(page)

    const modal = page.getByRole('dialog', { name: '메시지 삭제' })
    await modal.getByRole('button', { name: '삭제' }).click()

    // 모달은 즉시 닫힘 (handleDeleteConfirm에서 setShowDeleteModal(false) 동기 실행)
    await expect(modal).toBeHidden({ timeout: 3000 })

    // API 실패 → onError에서 is_deleted를 원래 상태로 복구
    await expect(page.getByText(MY_MESSAGE_CONTENT)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('삭제된 메시지입니다.')).toBeHidden()
  })

  test('삭제 API 실패 시 에러 토스트가 표시된다', async ({ page }) => {
    await openFirstConversationWithDeleteFailure(page)
    await openDeleteModal(page)

    const modal = page.getByRole('dialog', { name: '메시지 삭제' })
    await modal.getByRole('button', { name: '삭제' }).click()

    // getApiErrorMessage는 500대 에러를 공통 문구로 고정 반환
    await expect(page.getByText('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')).toBeVisible({ timeout: 5000 })
  })

  test('삭제 API 실패 후 DELETE 요청이 올바른 URL로 시도됐음을 확인한다', async ({ page }) => {
    await openFirstConversationWithDeleteFailure(page)
    await openDeleteModal(page)

    const modal = page.getByRole('dialog', { name: '메시지 삭제' })
    await modal.getByRole('button', { name: '삭제' }).click()

    await expect(page.getByText(MY_MESSAGE_CONTENT)).toBeVisible({ timeout: 5000 })

    const captures = await getCaptures(page)
    const deleteReq = captures.find(
      (c) =>
        c.method === 'DELETE' &&
        c.url.includes(`/direct-messages/conversations/${FIRST_CONVERSATION_ID}/messages/`) &&
        c.url.includes(MY_MESSAGE_ID),
    )
    expect(deleteReq).toBeTruthy()
  })

  test('상대방 메시지를 클릭해도 삭제 드롭다운이 열리지 않는다', async ({ page }) => {
    await openFirstConversation(page)

    // 상대방 메시지 클릭 (isMine=false → onClick 핸들러 비활성)
    await page.getByText(OPPONENT_MESSAGE_CONTENT).last().click()

    await page.waitForTimeout(300)
    await expect(page.getByRole('button', { name: '삭제', exact: true })).toHaveCount(0)
  })
})
