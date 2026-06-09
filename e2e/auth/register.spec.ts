/**
 * /register 페이지 E2E 테스트
 *
 * API 의존 테스트는 MSW authHandlers가 활성화되어야 한다.
 * src/mocks/handlers/index.ts 에서 ...authHandlers 주석 해제 후 실행.
 *
 * Mock 인증 코드: 123456
 */

import { test, expect } from '@playwright/test'

test.describe('회원가입 페이지 렌더링', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
  })

  test('회원가입 페이지가 렌더링된다', async ({ page }) => {
    await expect(page).toHaveURL('/register')
  })

  test('이메일 입력 필드가 표시된다', async ({ page }) => {
    await expect(page.getByPlaceholder('이메일 주소를 입력해주세요')).toBeVisible()
  })

  test('인증 요청 버튼이 표시된다', async ({ page }) => {
    await expect(page.getByRole('button', { name: '인증 요청' })).toBeVisible()
  })

  test('비밀번호 입력 필드가 표시된다', async ({ page }) => {
    await expect(page.getByPlaceholder('8자 이상, 영문 + 숫자 + 특수문자 조합')).toBeVisible()
  })

  test('비밀번호 확인 필드가 표시된다', async ({ page }) => {
    await expect(page.getByPlaceholder('비밀번호를 다시 입력해주세요')).toBeVisible()
  })

  test('닉네임 입력 필드가 표시된다', async ({ page }) => {
    await expect(page.getByPlaceholder('영문, 숫자, _, . 사용 가능 (2~10자)')).toBeVisible()
  })

  test('이름 입력 필드가 표시된다', async ({ page }) => {
    await expect(page.getByPlaceholder('실명을 입력해주세요')).toBeVisible()
  })

  test('"회원가입 완료" 버튼이 표시된다', async ({ page }) => {
    await expect(page.getByRole('button', { name: '회원가입 완료' })).toBeVisible()
  })
})

test.describe('회원가입 폼 유효성 검사', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
  })

  test('잘못된 이메일 형식으로 제출하면 에러 메시지가 표시된다', async ({ page }) => {
    await page.getByPlaceholder('이메일 주소를 입력해주세요').fill('notanemail')
    await page.getByRole('button', { name: '회원가입 완료' }).click()
    await expect(page.getByText('올바른 이메일 형식이 아닙니다')).toBeVisible()
  })

  test('비밀번호가 8자 미만이면 에러 메시지가 표시된다', async ({ page }) => {
    await page.getByPlaceholder('8자 이상, 영문 + 숫자 + 특수문자 조합').fill('Ab1!')
    await page.getByRole('button', { name: '회원가입 완료' }).click()
    await expect(page.getByText('8자 이상이어야 합니다')).toBeVisible()
  })

  test('비밀번호에 영문이 없으면 에러 메시지가 표시된다', async ({ page }) => {
    await page.getByPlaceholder('8자 이상, 영문 + 숫자 + 특수문자 조합').fill('12345678!')
    await page.getByRole('button', { name: '회원가입 완료' }).click()
    await expect(page.getByText('영문이 포함되어야 합니다')).toBeVisible()
  })

  test('비밀번호 확인이 불일치하면 에러 메시지가 표시된다', async ({ page }) => {
    await page.getByPlaceholder('8자 이상, 영문 + 숫자 + 특수문자 조합').fill('Test1234!')
    await page.getByPlaceholder('비밀번호를 다시 입력해주세요').fill('Test9999!')
    await page.getByRole('button', { name: '회원가입 완료' }).click()
    await expect(page.getByText('비밀번호가 일치하지 않습니다')).toBeVisible()
  })

  test('이메일 인증 없이 제출하면 에러 메시지가 표시된다', async ({ page }) => {
    await page.getByRole('button', { name: '회원가입 완료' }).click()
    await expect(page.getByText('이메일 인증이 필요합니다')).toBeVisible()
  })
})

// authHandlers 활성화 필요 (src/mocks/handlers/index.ts에서 ...authHandlers 주석 해제)
test.describe('닉네임 중복 확인', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
  })

  test('사용 가능한 닉네임 입력 시 성공 메시지가 표시된다', async ({ page }) => {
    await page.getByPlaceholder('영문, 숫자, _, . 사용 가능 (2~10자)').fill('newuser')
    await page.getByRole('button', { name: '중복확인' }).click()
    await expect(page.getByText('사용가능한 닉네임 입니다.')).toBeVisible()
  })

  test('이미 사용중인 닉네임(mock: danim_user) 입력 시 에러 메시지가 표시된다', async ({ page }) => {
    // MSW에서 MOCK_USER.nickname과 일치하면 중복 처리
    // 닉네임 규칙(영문·숫자·_·.)에 맞는 영문 닉네임으로 mock 테스트
    await page.addInitScript(() => {
      const orig = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : String(input)
        if (url.includes('/users/check-nickname')) {
          return new Response(
            JSON.stringify({ error_detail: '중복된 닉네임 입니다.' }),
            { status: 409, headers: { 'Content-Type': 'application/json' } }
          )
        }
        return orig(input, init)
      }
    })
    await page.goto('/register')
    await page.getByPlaceholder('영문, 숫자, _, . 사용 가능 (2~10자)').fill('takenname')
    await page.getByRole('button', { name: '중복확인' }).click()
    await expect(page.getByText('중복된 닉네임 입니다.')).toBeVisible()
  })

  test('중복확인 통과 후 닉네임 변경 시 중복확인이 초기화된다', async ({ page }) => {
    await page.getByPlaceholder('영문, 숫자, _, . 사용 가능 (2~10자)').fill('newuser')
    await page.getByRole('button', { name: '중복확인' }).click()
    await expect(page.getByText('사용가능한 닉네임 입니다.')).toBeVisible()

    // 닉네임 변경 → 중복확인 결과 초기화
    await page.getByPlaceholder('영문, 숫자, _, . 사용 가능 (2~10자)').fill('newuser2')
    await expect(page.getByText('사용가능한 닉네임 입니다.')).not.toBeVisible()
  })

  test('중복확인 없이 제출하면 에러 메시지가 표시된다', async ({ page }) => {
    await page.getByPlaceholder('영문, 숫자, _, . 사용 가능 (2~10자)').fill('newuser')
    await page.getByRole('button', { name: '회원가입 완료' }).click()
    await expect(page.getByText('닉네임 중복확인을 해주세요')).toBeVisible()
  })
})

// authHandlers 활성화 필요 (src/mocks/handlers/index.ts에서 ...authHandlers 주석 해제)
test.describe('이메일 인증 플로우', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
  })

  test('인증 요청 후 인증 코드 필드가 표시된다', async ({ page }) => {
    await page.getByPlaceholder('이메일 주소를 입력해주세요').fill('newuser@test.com')
    await page.getByRole('button', { name: '인증 요청' }).click()
    await expect(page.getByPlaceholder('인증 코드 6자리 입력')).toBeVisible()
  })

  test('올바른 인증 코드(123456) 입력 시 인증 완료 메시지가 표시된다', async ({ page }) => {
    await page.getByPlaceholder('이메일 주소를 입력해주세요').fill('newuser@test.com')
    await page.getByRole('button', { name: '인증 요청' }).click()
    await page.getByPlaceholder('인증 코드 6자리 입력').fill('123456')
    await page.getByRole('button', { name: '확인', exact: true }).click()
    await expect(page.getByText('이메일 인증이 완료되었습니다.')).toBeVisible()
  })

  test('잘못된 인증 코드 입력 시 에러 메시지가 표시된다', async ({ page }) => {
    await page.getByPlaceholder('이메일 주소를 입력해주세요').fill('newuser@test.com')
    await page.getByRole('button', { name: '인증 요청' }).click()
    await page.getByPlaceholder('인증 코드 6자리 입력').fill('000000')
    await page.getByRole('button', { name: '확인', exact: true }).click()
    await expect(page.getByText('인증 코드가 올바르지 않습니다.')).toBeVisible()
  })

  test('인증 요청 후 "재요청" 버튼이 표시되고 재요청 시 코드가 다시 발송된다', async ({ page }) => {
    await page.getByPlaceholder('이메일 주소를 입력해주세요').fill('newuser@test.com')
    await page.getByRole('button', { name: '인증 요청' }).click()
    // 첫 요청 후 버튼이 "재요청"으로 변경됨
    await expect(page.getByRole('button', { name: '재요청' })).toBeVisible()

    // 재요청 클릭 → 코드 필드 여전히 표시
    await page.getByRole('button', { name: '재요청' }).click()
    await expect(page.getByPlaceholder('인증 코드 6자리 입력')).toBeVisible()
  })
})

// authHandlers 활성화 필요 (src/mocks/handlers/index.ts에서 ...authHandlers 주석 해제)
test.describe('회원가입 성공 플로우', () => {
  test('모든 필드를 올바르게 입력하고 제출하면 /login으로 이동한다', async ({ page }) => {
    await page.goto('/register')

    // 이메일 인증
    await page.getByPlaceholder('이메일 주소를 입력해주세요').fill('newuser@test.com')
    await page.getByRole('button', { name: '인증 요청' }).click()
    await page.getByPlaceholder('인증 코드 6자리 입력').fill('123456')
    await page.getByRole('button', { name: '확인', exact: true }).click()
    await expect(page.getByText('이메일 인증이 완료되었습니다.')).toBeVisible()

    // 비밀번호
    await page.getByPlaceholder('8자 이상, 영문 + 숫자 + 특수문자 조합').fill('Test1234!')
    await page.getByPlaceholder('비밀번호를 다시 입력해주세요').fill('Test1234!')

    // 닉네임 중복확인
    await page.getByPlaceholder('영문, 숫자, _, . 사용 가능 (2~10자)').fill('newuser')
    await page.getByRole('button', { name: '중복확인' }).click()
    await expect(page.getByText('사용가능한 닉네임 입니다.')).toBeVisible()

    // 이름 + 생년월일
    await page.getByPlaceholder('실명을 입력해주세요').fill('홍길동')
    await page.getByLabel('출생 연도').fill('1995')
    await page.getByLabel('출생 월').fill('06')
    await page.getByLabel('출생 일').fill('15')

    await page.getByRole('button', { name: '회원가입 완료' }).click()
    await expect(page).toHaveURL('/login')
  })
})
