@AGENTS.md

# Danim (다님) — Claude Code 가이드

여행 경로를 지도에 기록하고 공유하는 소셜 플랫폼.

---

## 명령어

- **개발 서버:** `pnpm dev` (http://localhost:3000)
- **빌드:** `pnpm build`
- **린트:** `pnpm lint` (ESLint)
- **타입 체크:** `pnpm type-check`

---

## 기술 스택

| 역할 | 라이브러리 |
|------|-----------|
| 프레임워크 | Next.js 16 + React 19 + TypeScript 5 |
| 스타일 | Tailwind CSS v4 |
| UI 컴포넌트 | shadcn/ui + Lucide React |
| 서버 상태 | TanStack Query v5 |
| 클라이언트 상태 | Zustand |
| URL 상태 | nuqs |
| HTTP 클라이언트 | ky (`src/lib/apiClient.ts` 경유, 직접 호출 금지) |
| 폼 + 유효성 | React Hook Form + Zod |
| 날짜 | date-fns |
| 애니메이션 | Motion (Framer Motion) |
| 지도 | KakaoMap SDK (`dynamic()` import 필수, SSR 비활성화) |
| Git 훅 | Husky + lint-staged |

---

## 아키텍처

### 데이터 흐름

```
Page / Component
    ├─ 서버 데이터  → TanStack Query → ApiClient (ky) → 외부 백엔드
    ├─ URL 상태    → nuqs
    └─ UI 상태     → Zustand
```

### 핵심 규칙

- **컴포넌트에서 `ky`/`fetch` 직접 호출 금지** → `src/lib/apiClient.ts` 경유
- **Zustand에 서버 데이터 저장 금지** → TanStack Query 사용
- **`process.env` 직접 참조 금지** → `src/lib/config.ts` 경유
- **KakaoMap SDK는 `dynamic()` import만 사용** (SSR 비활성화 필수)
- **`any` 타입 사용 금지**
- **쿼리 키 하드코딩 금지** → `src/lib/queryKeys.ts` 경유

### 컴포넌트 분류

| 종류 | 위치 | 설명 |
|------|------|------|
| UI Primitive | `src/components/ui/` | shadcn/ui 기반, 스타일만 |
| 공통 | `src/components/` | 2개 이상 페이지에서 사용 |
| 페이지 전용 | `src/app/{page}/_components/` | 해당 페이지에서만 사용 |
| 페이지 전용 훅 | `src/app/{page}/_hooks/` | 해당 페이지에서만 사용하는 훅 |
| Page | `src/app/**/page.tsx` | 라우트 진입점, 조합만 담당 |

---

## 디자인 시스템

- **주 색상:** `#3ECBA0` (민트 그린)
- **배경:** `#F5F5F5`
- **SideNav:** 좌측 고정 68px, `(public)` 그룹(로그인·회원가입)에서 숨김
- Tailwind utility class만 사용, 인라인 스타일 금지
- **색상 하드코딩 금지** — hex 값을 코드에 직접 쓰지 않는다. 반드시 정의된 색상 토큰(`bg-primary`, `text-primary` 등 Tailwind 테마 토큰)을 사용한다.

---

## 페이지 구조

| 경로 | 설명 |
|------|------|
| `/` | 홈: 팔로잉 피드(좌) + 카카오맵(우) |
| `/explore` | 탐색: 검색 + 필터 + 마소너리 그리드 |
| `/write` | 여행 기록 작성: 사진업로드 + 폼 |
| `/write/[postId]/edit` | 여행 기록 수정 (작성 폼 컴포넌트 재활용) |
| `/mypage` | 마이페이지: 프로필 + 뱃지 + 게시글 그리드 |
| `/users/[userId]` | 타인 프로필 조회 |
| `/settings` | 설정: 프로필 편집, 휴대폰 인증, 비밀번호, 탈퇴 |
| `/followers` | 팔로워/팔로잉 목록 |
| `/dm` | DM: 대화 목록 (대화방 미선택 상태) |
| `/dm/[roomId]` | DM: 특정 대화방 (좌측 목록 고정, 우측 채팅) |
| `/login` | 로그인: 소셜 + 이메일 |
| `/register` | 회원가입 |
| `/social-callback` | 소셜 로그인 콜백 수신 (백엔드 302 리다이렉트 도착지) |

---

## 인증 흐름

- **access_token** — 인메모리(`authStore.accessToken`), 새로고침 시 silent refresh로 복원
- **refresh_token** — HttpOnly 쿠키 (백엔드가 자동 관리, JS 접근 불가)
- **로그인 여부 확인** — `useAuthStore(s => !!s.accessToken)` 패턴 사용 (`isLoggedIn()` 함수 없음)

**앱 초기화 시 silent refresh 흐름:**
```
앱 마운트 → POST /api/v1/users/me/refresh (쿠키 자동 포함)
  ├─ 성공 → access_token Zustand 저장 → 인증 상태 복원
  └─ 실패 → 비로그인 상태 유지
```

**소셜 로그인 콜백 흐름:**
```
/social-callback?provider=kakao&is_success=true 수신
  → POST /api/v1/users/me/refresh → access_token 발급
  → / 로 이동
```

---

## 주요 파일 경로

```
src/lib/apiClient.ts              # ky 기반 API 클라이언트 (단일 진입점)
src/lib/config.ts                 # 환경변수 접근점 (process.env 직접 사용 금지)
src/lib/queryKeys.ts              # TanStack Query 키 상수
src/types/index.ts                # 전역 타입 정의 진입점
src/providers/index.tsx           # Providers + AuthBootstrap + MSW 초기화 (개발 환경)
docs/CONVENTION.md                # 브랜치·커밋·PR 컨벤션
docs/PROJECT_STRUCTURE.md         # 프로젝트 폴더 구조 규칙
```

---

## 상태 관리 패턴

```typescript
// 서버 데이터 — TanStack Query + apiClient + queryKeys
const { data } = useQuery({
  queryKey: queryKeys.posts.detail(postId),
  queryFn: () => apiClient.get(`v1/posts/${postId}`).json<PostDetail>()
})

// URL 상태 — nuqs (/explore 필터, 검색어 등)
const [category, setCategory] = useQueryState('category')

// UI 상태 — Zustand (모달 열림, 선택된 마커 등)
const { postModalId, openPostModal } = useUIStore()
```

---

## API 응답 형식

백엔드는 래퍼 없이 직접 응답 body를 반환한다.

```typescript
// 성공 — 엔드포인트마다 다름
{ detail: string }           // 단순 처리 결과
{ access_token: string }     // 로그인/토큰 재발급
{ post_id: string, ... }     // 리소스 반환

// 실패
{ error_detail: string }                          // 단순 에러
{ error_detail: { field_name: string[] } }        // 필드별 유효성 에러
```

타입은 `src/types/index.ts`의 `ApiError`, `DetailResponse`를 사용한다.

---

## 참조 문서

| 문서 | 용도 |
|------|------|
| `docs/CONVENTION.md` | 브랜치·커밋·PR 컨벤션 |
| `docs/PROJECT_STRUCTURE.md` | 폴더 구조 규칙 |
| `docs/ROUTING.md` | 프론트엔드 페이지 라우팅 |
| `docs/카카오맵-가이드.md` | KakaoMap SDK 사용 가이드 |
