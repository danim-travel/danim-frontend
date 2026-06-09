# 회원가입 플로우 코드 설명

## 전체 흐름 한눈에

```
/register 페이지 접근
  └─ RegisterPage (page.tsx)
       └─ RegisterForm (FormProvider + 폼 상태 관리)
            ├─ AccountSection (이메일 인증 + 비밀번호)
            │    └─ useEmailVerification (이메일 인증 상태 관리)
            │         ├─ requestEmailVerify() → POST /v1/users/verification/send-email
            │         └─ confirmEmailCode()  → POST /v1/users/verification/verify-email
            └─ ProfileSection (이름 + 생년월일 + 닉네임)
                 └─ useNicknameCheck (닉네임 중복 확인 상태 관리)
                      └─ checkNickname() → POST /v1/users/check-nickname
                           ↓ (모든 필드 입력 완료 후 "회원가입 완료" 버튼)
                      signup() → POST /v1/users/signup
                           ↓ 성공
                      toast.success + router.push("/login")
```

---

## 1. 페이지 진입: `register/page.tsx`

```
src/app/(public)/register/page.tsx
```

서버 컴포넌트. 레이아웃 껍데기(`AuthCard`)를 렌더링하고 `<RegisterForm />`을 마운트한다.
별도 데이터 페칭 없이 순수하게 조합만 담당한다.

---

## 2. 폼 상태 관리: `_components/RegisterForm.tsx`

```
src/app/(public)/register/_components/RegisterForm.tsx
```

`react-hook-form`의 `FormProvider`로 하위 컴포넌트에 폼 컨텍스트를 제공한다.

**초기값:**
```ts
{ email: "", emailToken: "", password: "", passwordConfirm: "",
  nickname: "", name: "", birthYear: "", birthMonth: "", birthDay: "" }
```

**제출 흐름 (`onSubmit`):**
1. Zod 스키마(`signupSchema`) 유효성 통과 후 실행
2. `birthYear / birthMonth / birthDay` → `YYYY-MM-DD` 문자열로 조합
3. `signup()` API 호출
4. 성공: `toast.success` → `/login`으로 이동 (회원가입 직후 자동 로그인 없음)
5. 실패: `getApiErrorMessage`로 에러 메시지 추출 → `toast.error`

---

## 3. 유효성 스키마: `_schema.ts`

```
src/app/(public)/register/_schema.ts
```

Zod로 모든 폼 필드의 유효성 규칙을 한 곳에 정의한다.

| 필드 | 규칙 |
|------|------|
| `email` | 이메일 형식 |
| `emailToken` | 필수 (이메일 인증 완료 시 자동 채워짐) |
| `password` | 8~20자, 영문+숫자+특수문자 포함 (`PASSWORD_RULES`) |
| `passwordConfirm` | `password`와 동일한지 `.refine()` 검사 |
| `nickname` | 2~20자, 영문·한글·숫자만 (`NICKNAME_RULES`) |
| `name` | 필수 |
| `birthYear` | 4자리 숫자 |
| `birthMonth` | 1~12 |
| `birthDay` | 1~31 |

**상수 위치:**
- `PASSWORD_RULES` → `src/app/(public)/_constants/passwordValidation.ts` (로그인 페이지와 공유)
- `NICKNAME_RULES` → `src/app/(public)/register/_constants/nicknameValidation.ts` (회원가입 전용)

---

## 4. 이메일 인증 섹션: `_components/AccountSection.tsx`

```
src/app/(public)/register/_components/AccountSection.tsx
```

`useFormContext`로 상위 `RegisterForm`의 폼 컨텍스트에 접근한다.
이메일 인증 상태는 `useEmailVerification` 훅에 위임한다.

**렌더링 구조:**
- 이메일 입력 + "인증 요청" 버튼 (`VerificationField`)
- 인증 코드 입력 + "확인" 버튼 (`VerificationField`)
- 비밀번호 입력 + 강도 표시 (`PasswordField` + `PasswordStrength`)
- 비밀번호 확인 (`TextField`)

**이메일 변경 시:** `resetVerification()` 호출 → 인증 상태 초기화

**인증 완료 시:** `onVerified` 콜백으로 `emailToken`을 폼에 `setValue` → Zod가 `emailToken` 유효성 통과 처리

---

## 5. 이메일 인증 훅: `_hooks/useEmailVerification.ts`

```
src/app/(public)/register/_hooks/useEmailVerification.ts
```

이메일 인증 전체 생명주기를 관리하는 훅. `purpose: 'signup' | 'find_password'`를 받아
회원가입/비밀번호 재설정 양쪽에서 재사용된다.

**상태:**
```ts
code          // 사용자가 입력한 인증 코드
codeSent      // 코드 발송 완료 여부
verified      // 인증 완료 여부
requestLoading / confirmLoading / confirmError
```

**`requestVerify(email)`:**
```
POST /v1/users/verification/send-email
  body: { email, purpose: 'signup' }
  성공 → codeSent = true, toast.success
  실패 → toast.error
```

**`confirmCode(email)`:**
```
POST /v1/users/verification/verify-email
  body: { email, code, purpose: 'signup' }
  성공 → verified = true, onVerified(email_token) 콜백 실행
  실패 → confirmError에 메시지 저장
```

응답 타입: `ConfirmEmailResponse { detail: string; email_token: string }`

---

## 6. 프로필 섹션: `_components/ProfileSection.tsx`

```
src/app/(public)/register/_components/ProfileSection.tsx
```

이름, 생년월일(년/월/일 분리 입력), 닉네임을 처리한다.

**생년월일 입력:**
- 년(4자리) / 월(2자리) / 일(2자리) 필드를 각각 `useController`로 연결
- `onChange`에서 숫자 외 문자 제거(`replace(/\D/g, "")`)
- 에러는 세 필드 중 첫 번째 메시지를 노출

**닉네임 중복 확인:**
`useNicknameCheck` 훅에 위임한다. 닉네임 변경 시 이전 확인 결과를 초기화한다.

**`helperTone` 계산:**
```ts
const nicknameHelperTone =
  errors.nickname?.message   ? "error"    // 폼 유효성 에러 우선
  : nicknameResult?.ok       ? "primary"  // 사용 가능
  : nicknameResult           ? "error"    // 중복
  : "muted"                               // 기본 안내
```

---

## 7. 닉네임 중복 확인 훅: `_hooks/useNicknameCheck.ts`

```
src/app/(public)/register/_hooks/useNicknameCheck.ts
```

`useEmailVerification`과 대칭 구조로 닉네임 중복 확인 상태를 관리한다.

**`checkDuplicate(nickname)`:**
```
POST /v1/users/check-nickname
  body: { nickname }
  성공(200) → result = { ok: true,  message: "사용가능한 닉네임 입니다." }
  실패(409) → result = { ok: false, message: "중복된 닉네임입니다." }
```

**`canCheck(nickname)`:** 최소 길이(`NICKNAME_RULES.minLength = 2`) 미만이면 버튼 비활성화

---

## 8. API 호출 계층: `lib/api/auth.ts`

```
src/lib/api/auth.ts
```

회원가입에서 사용하는 공개 엔드포인트 함수들.

```ts
// 이메일 인증 코드 발송
requestEmailVerify(email, purpose)
  → publicClient.post('v1/users/verification/send-email')

// 인증 코드 확인 → email_token 반환
confirmEmailCode(email, code, purpose)
  → publicClient.post('v1/users/verification/verify-email')

// 닉네임 중복 확인
checkNickname(nickname)
  → publicClient.post('v1/users/check-nickname')

// 회원가입 최종 제출
signup(data: SignupRequest)
  → publicClient.post('v1/users/signup')
```

모두 `publicClient`를 사용한다 — access_token 없이 호출 가능한 공개 엔드포인트이기 때문.

---

## 9. HTTP 클라이언트: `lib/apiClient.ts`

```
src/lib/apiClient.ts
```

**`publicClient`** — 회원가입 흐름 전체에서 사용.

```
ky.create({ prefixUrl: config.apiUrl, credentials: 'include' })
  + beforeError 훅: 에러 응답 body의 error_detail → ApiError로 정규화
```

에러 응답이 오면 `normalizeErrorHook`이 실행된다:
```
{ error_detail: "중복된 닉네임 입니다." }
  → ApiError { status: 409, detail: "중복된 닉네임 입니다." }
```

---

## 10. 에러 처리: `lib/apiError.ts`

```
src/lib/apiError.ts
```

**`ApiErrorDetail`** — 백엔드 에러 응답 두 가지 형태를 포괄:
```ts
type ApiErrorDetail = string | Record<string, string | string[]>
// 예: "중복된 닉네임입니다."
// 예: { "nickname": ["이 필드는 필수입니다."] }
```

**`getApiErrorMessage(err, { client, server })`** — 토스트에 표시할 문자열 추출:
```
ApiError + detail이 문자열  → detail 그대로 반환
ApiError + detail이 객체    → 첫 번째 필드의 첫 번째 메시지 반환
ApiError + status >= 500    → fallback.server
ApiError + status < 500     → fallback.client
ApiError 아님               → fallback.server
```

---

## 11. MSW Mock (개발 환경): `mocks/handlers/auth.ts`

```
src/mocks/handlers/auth.ts
```

개발 환경에서 실제 백엔드 없이 동작하도록 API를 가로챈다.

| 엔드포인트 | Mock 동작 |
|------------|-----------|
| `POST */v1/users/signup` | 항상 201 성공 |
| `POST */v1/users/verification/send-email` | 항상 성공 |
| `POST */v1/users/verification/verify-email` | 코드 `123456`이면 성공, 아니면 400 |
| `POST */v1/users/check-nickname` | `MOCK_USER.nickname`과 같으면 409, 아니면 성공 |

---

## 전체 데이터 흐름 요약

```
사용자 입력
  │
  ├─ 이메일 입력 → "인증 요청" 클릭
  │    └─ POST send-email → 이메일 발송
  │         → "123456" 입력 후 "확인" 클릭
  │         └─ POST verify-email → email_token 발급
  │              → emailToken 폼 필드에 숨겨서 저장
  │
  ├─ 닉네임 입력 → "중복확인" 클릭
  │    └─ POST check-nickname → 사용 가능/불가 결과 표시
  │
  ├─ 이름 / 생년월일 / 비밀번호 입력
  │
  └─ "회원가입 완료" 버튼 클릭
       └─ Zod signupSchema 유효성 검사
            → 통과 시 POST signup
              body: { email_token, password, nickname, name, birth_date }
              └─ 성공: toast + /login 이동
              └─ 실패: toast.error (에러 메시지 추출)
```
