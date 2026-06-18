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
 *   WS:
 *     - /ws/dm auth 후 send_message 전송
 *
 * 검증 항목:
 *   1. 채팅방 목록 렌더링 / 검색 / 빈 검색 결과
 *   2. 새 대화 모달에서 팔로잉 사용자 선택 → 채팅방 생성 API 호출 → 방으로 이동
 *   3. 방 입장 후 헤더·기존 메시지 렌더링
 *   4. 메시지 입력 후 버튼/Enter 전송 → 낙관적 렌더링 및 WebSocket echo 반영
 */

import { test, expect, type Page } from '@playwright/test'

type CapturedRequest = { url: string; method: string; body: string | null }

const MOCK_USER_ID = '01KSSJE3FZQ0G042AS5J7AJVK6'
const FIRST_CONVERSATION_ID = '01HDMCONV000000000000001'
const FIRST_OPPONENT_ID = '01HDMPARTNER0000000000001'

async function bootstrapAuthedDmPage(page: Page) {
  await page.addInitScript({
    content: `
      (() => {
        const orig = window.fetch.bind(window);
        const OriginalWebSocket = window.WebSocket;
        window.__fetchCaptures = [];
        window.__wsCaptures = [];

        window.WebSocket = class extends OriginalWebSocket {
          constructor(url, protocols) {
            window.__wsCaptures.push(String(url));
            super(url, protocols);
          }
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

  test('입력 후 전송 버튼을 누르면 내 메시지가 추가되고 입력창이 비워진다', async ({ page }) => {
    await openFirstConversation(page)

    const input = page.getByPlaceholder('메시지 입력...')
    const sendButton = page.getByRole('button', { name: '전송', exact: true })
    await expect(input).toBeEnabled({ timeout: 15000 })
    await expect(sendButton).toBeDisabled()

    const message = `E2E 버튼 전송 ${Date.now()}`
    await input.fill(message)
    await expect(sendButton).toBeEnabled()
    await sendButton.click()

    await expect(input).toHaveValue('')
    await expect(page.getByText(message).last()).toBeVisible()
  })

  test('Enter 키로 메시지를 전송하고 대화방 WebSocket에 연결한다', async ({ page }) => {
    await openFirstConversation(page)

    const input = page.getByPlaceholder('메시지 입력...')
    await expect(input).toBeEnabled({ timeout: 15000 })

    const message = `E2E Enter 전송 ${Date.now()}`
    await input.fill(message)
    await input.press('Enter')

    await expect(input).toHaveValue('')
    await expect(page.getByText(message).last()).toBeVisible()

    const wsCaptures = await getWsCaptures(page)
    expect(wsCaptures.some(url => url.endsWith(`/ws/conversations/${FIRST_CONVERSATION_ID}/`))).toBe(true)
  })

  test('공백만 입력하면 전송 버튼이 비활성화되고 메시지가 추가되지 않는다', async ({ page }) => {
    await openFirstConversation(page)

    const input = page.getByPlaceholder('메시지 입력...')
    await expect(input).toBeEnabled({ timeout: 15000 })

    await input.fill('   ')
    await expect(page.getByRole('button', { name: '전송', exact: true })).toBeDisabled()
    await input.press('Enter')

    await expect(input).toHaveValue('   ')
  })
})
