/**
 * 내 정보 수정 > 프로필 사진 변경 E2E 테스트
 *
 * 성공 / 실패 케이스를 모두 검증한다.
 *
 * MSW 핸들러 (wildcard 매칭):
 *   POST  .../users/me/profile-image/presigned-url → { presigned_url, img_url, key }
 *   PUT   .../mock-s3-upload                       → 200 OK
 *
 * 실패 케이스는 page.evaluate()로 window.fetch를 패치해
 * MSW(Service Worker)보다 먼저 응답을 가로챈다.
 */

import { test, expect, type Page } from '@playwright/test'
import { setupAuthenticatedSettings } from './helpers'

/** 업로드할 가짜 JPEG 파일 */
const FAKE_IMAGE = {
  name: 'profile.jpg',
  mimeType: 'image/jpeg' as const,
  buffer: Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  ]),
}

/** 업로드 완료 대기 — isUploading(false) = 버튼 재활성화 */
async function waitForUploadDone(page: Page) {
  await expect(
    page.getByRole('button', { name: '사진 변경' }),
  ).not.toBeDisabled({ timeout: 8_000 })
}

/** 파일 input에 파일을 세팅한다 (hidden input이므로 locator로 직접 접근) */
async function selectFile(page: Page, file = FAKE_IMAGE) {
  await page.locator('input[type="file"][accept="image/*"]').setInputFiles(file)
}

/** 프로필 섹션의 아바타 img 요소 */
function avatarImg(page: Page) {
  return page
    .locator('section')
    .filter({ hasText: '내 프로필' })
    .locator('img[alt=""]')
}

// ─── 성공 케이스 ────────────────────────────────────────────────────────────

test.describe('프로필 사진 변경 — 성공', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSettings(page)
  })

  test('파일 선택 직후 "사진 변경" 버튼이 비활성화(로딩) 상태가 된다', async ({ page }) => {
    // 로딩 중 Button은 텍스트를 Spinner로 교체하므로
    // getByRole('button', { name: '사진 변경' })은 로딩 구간에 요소를 찾지 못한다.
    // 대신 section 내부의 로딩 스피너 출현으로 업로드 시작을 검증한다.
    await page.addInitScript(() => {
      const orig = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : String(input)
        const method = input instanceof Request ? input.method : (init?.method ?? 'GET')
        if (url.includes('/users/token/refresh') && method === 'POST') {
          return new Response(
            JSON.stringify({ access_token: 'mock_access_token' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }
        if (url.includes('profile-image/presigned-url')) {
          await new Promise<void>((r) => setTimeout(r, 3000))
        }
        return orig(input, init)
      }
    })
    await page.goto('/settings')
    await expect(page.getByRole('button', { name: '사진 변경' })).toBeVisible()

    await selectFile(page)

    // 로딩 스피너(role="status" aria-label="로딩 중")가 나타나면 isUploading=true 상태
    await expect(
      page.locator('section').filter({ hasText: '내 프로필' })
        .locator('[role="status"][aria-label="로딩 중"]'),
    ).toBeVisible({ timeout: 5_000 })
  })

  test('업로드 성공 후 버튼이 다시 활성화된다', async ({ page }) => {
    await selectFile(page)
    await waitForUploadDone(page)

    await expect(page.getByRole('button', { name: '사진 변경' })).toBeEnabled()
  })

  test('업로드 성공 후 에러 토스트가 표시되지 않는다', async ({ page }) => {
    await selectFile(page)
    await waitForUploadDone(page)

    await expect(page.getByRole('status')).not.toBeVisible()
  })

  test('업로드 성공 후 아바타 이미지가 업로드된 파일 기반 URL로 교체된다', async ({ page }) => {
    const img = avatarImg(page)

    // 초기 이미지(userprofile) 확인
    await expect(img).toHaveAttribute('src', /userprofile/)

    await selectFile(page)
    await waitForUploadDone(page)

    // MSW mock → img_url = https://picsum.photos/seed/profile.jpg/200/200
    // next/image가 /_next/image?url=...profile.jpg... 로 렌더링
    await expect(img).toHaveAttribute('src', /profile\.jpg/)
  })

  test('업로드 성공 후 "저장" 버튼 클릭 시 변경된 img_url이 서버로 전송된다', async ({ page }) => {
    // window.fetch를 래핑해 PATCH users/me 요청 body를 캡처한다
    await page.evaluate(() => {
      const orig = window.fetch.bind(window)
      type WithCaptures = Window & { __fetchCaptures: { url: string; body: string | null }[] }
      ;(window as unknown as WithCaptures).__fetchCaptures = []
      window.fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : String(input)
        let body: string | null = null
        try {
          if (input instanceof Request && input.body) body = await input.clone().text()
          else if (typeof init?.body === 'string') body = init.body
        } catch { /* ignore */ }
        ;(window as unknown as WithCaptures).__fetchCaptures.push({ url, body })
        return orig(input, init)
      }
    })

    await selectFile(page)
    await waitForUploadDone(page)

    await page.getByRole('button', { name: '저장' }).click()
    await expect(page.getByRole('status')).toBeVisible()

    const captures: { url: string; body: string | null }[] = await page.evaluate(
      () =>
        (window as Window & { __fetchCaptures?: { url: string; body: string | null }[] })
          .__fetchCaptures ?? [],
    )
    const patchReq = captures.find(
      (c) => c.url.includes('users/me') && !c.url.includes('profile-image'),
    )
    expect(patchReq).toBeDefined()
    const body = JSON.parse(patchReq!.body ?? '{}')
    // blob URL이 아니라 S3 img_url이 전송되어야 한다
    expect(body.profile_img).toMatch(/^https?:\/\//)
    expect(body.profile_img).not.toMatch(/^blob:/)
    expect(body.profile_img).toContain('profile.jpg')
  })
})

// ─── 실패 케이스 ────────────────────────────────────────────────────────────

test.describe('프로필 사진 변경 — 실패', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSettings(page)
  })

  // ── presigned URL 발급 실패 ─────────────────────────────────────────────

  test('presigned URL 발급 실패(500) 시 에러 토스트가 표시된다', async ({ page }) => {
    await page.evaluate(() => {
      const orig = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : String(input)
        if (url.includes('profile-image/presigned-url')) {
          return new Response(
            JSON.stringify({ error_detail: '이미지 업로드에 실패했습니다.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          )
        }
        return orig(input, init)
      }
    })

    await selectFile(page)
    await waitForUploadDone(page)

    await expect(page.getByRole('status')).toBeVisible()
    // getApiErrorMessage는 5xx에 대해 error_detail 무관하게 제네릭 메시지를 반환
    await expect(page.getByRole('status')).toContainText('서버 오류가 발생했습니다.')
  })

  test('presigned URL 발급 실패 시 아바타 이미지가 변경되지 않는다', async ({ page }) => {
    const img = avatarImg(page)
    const initialSrc = await img.getAttribute('src')

    await page.evaluate(() => {
      const orig = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : String(input)
        if (url.includes('profile-image/presigned-url')) {
          return new Response(
            JSON.stringify({ error_detail: '이미지 업로드에 실패했습니다.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          )
        }
        return orig(input, init)
      }
    })

    await selectFile(page)
    await waitForUploadDone(page)

    expect(await img.getAttribute('src')).toBe(initialSrc)
  })

  test('presigned URL 발급 실패 후 버튼이 재활성화되어 재업로드가 가능하다', async ({ page }) => {
    await page.evaluate(() => {
      const orig = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : String(input)
        if (url.includes('profile-image/presigned-url')) {
          return new Response(
            JSON.stringify({ error_detail: '이미지 업로드에 실패했습니다.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          )
        }
        return orig(input, init)
      }
    })

    // 1차 실패
    await selectFile(page)
    await waitForUploadDone(page)
    await expect(page.getByRole('status')).toBeVisible()

    // catch 블록에서 fileInputRef.current.value = "" 호출 → 동일 파일 재선택 가능
    await expect(page.getByRole('button', { name: '사진 변경' })).toBeEnabled()

    // 2차 시도
    await selectFile(page)
    await waitForUploadDone(page)
    await expect(page.getByRole('status')).toBeVisible()
  })

  // ── S3 PUT 실패 ─────────────────────────────────────────────────────────

  test('S3 업로드 실패(500) 시 에러 토스트가 표시된다', async ({ page }) => {
    await page.evaluate(() => {
      const orig = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : String(input)
        const method = input instanceof Request ? input.method : (init?.method ?? 'GET')
        if (url.includes('mock-s3-upload') && method === 'PUT') {
          return new Response(null, { status: 500 })
        }
        return orig(input, init)
      }
    })

    await selectFile(page)
    await waitForUploadDone(page)

    await expect(page.getByRole('status')).toBeVisible()
    // getApiErrorMessage는 5xx에 대해 error_detail 무관하게 제네릭 메시지를 반환
    await expect(page.getByRole('status')).toContainText('서버 오류가 발생했습니다.')
  })

  test('S3 업로드 실패 시 onProfileImgChange가 호출되지 않아 아바타가 변경되지 않는다', async ({
    page,
  }) => {
    const img = avatarImg(page)
    const initialSrc = await img.getAttribute('src')

    await page.evaluate(() => {
      const orig = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : String(input)
        const method = input instanceof Request ? input.method : (init?.method ?? 'GET')
        if (url.includes('mock-s3-upload') && method === 'PUT') {
          return new Response(null, { status: 500 })
        }
        return orig(input, init)
      }
    })

    await selectFile(page)
    await waitForUploadDone(page)

    // img_url이 profileImg로 반영되지 않아야 한다
    expect(await img.getAttribute('src')).toBe(initialSrc)
  })

  test('S3 업로드 실패 후 버튼이 재활성화되어 재업로드가 가능하다', async ({ page }) => {
    await page.evaluate(() => {
      const orig = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : String(input)
        const method = input instanceof Request ? input.method : (init?.method ?? 'GET')
        if (url.includes('mock-s3-upload') && method === 'PUT') {
          return new Response(null, { status: 500 })
        }
        return orig(input, init)
      }
    })

    await selectFile(page)
    await waitForUploadDone(page)

    await expect(page.getByRole('button', { name: '사진 변경' })).toBeEnabled()
  })

  // ── 네트워크 오류 ────────────────────────────────────────────────────────

  test('네트워크 오류(fetch throw) 시 에러 토스트가 표시된다', async ({ page }) => {
    await page.evaluate(() => {
      const orig = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : String(input)
        if (url.includes('profile-image/presigned-url')) {
          throw new TypeError('Failed to fetch')
        }
        return orig(input, init)
      }
    })

    await selectFile(page)
    await waitForUploadDone(page)

    await expect(page.getByRole('status')).toBeVisible()
  })
})
