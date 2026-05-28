# 프로젝트 구조

## 기본 원칙

페이지(기능) 단위로 필요한 컴포넌트와 로직을 해당 라우트 폴더 내부에 함께 배치합니다.
공통으로 사용되는 요소만 최상단 폴더에 둡니다.

---

## 디렉토리 구조

```
src/
├── app/
│   ├── layout.tsx                  # 루트 레이아웃 (Providers, NuqsAdapter)
│   ├── globals.css
│   │
│   ├── (main)/                     # SideNav가 있는 인증 필요 페이지 그룹
│   │   ├── layout.tsx              # SideNav 포함 레이아웃
│   │   ├── page.tsx                # 홈 (팔로잉 피드 + 지도)
│   │   ├── _components/            # (main) 전용 공통 컴포넌트
│   │   │   ├── NotificationDrawer.tsx  # 알림 드로어 (SideNav 아이콘으로 토글)
│   │   │   └── SearchDrawer.tsx        # 유저 검색 드로어 (SideNav 아이콘으로 토글)
│   │   ├── explore/
│   │   │   ├── page.tsx
│   │   │   └── _components/
│   │   ├── write/
│   │   │   ├── page.tsx            # 게시글 작성
│   │   │   ├── [postId]/
│   │   │   │   └── edit/
│   │   │   │       └── page.tsx    # 게시글 수정
│   │   │   └── _components/        # 작성/수정 공용 폼 컴포넌트
│   │   ├── dm/
│   │   │   ├── layout.tsx          # 좌측 ConversationList 고정, 우측 {children}
│   │   │   ├── page.tsx            # 대화방 미선택 상태
│   │   │   ├── [roomId]/
│   │   │   │   └── page.tsx        # 특정 대화방
│   │   │   └── _components/        # ConversationList, ChatRoom, MessageItem, MessageInput
│   │   ├── mypage/
│   │   │   ├── page.tsx
│   │   │   └── _components/
│   │   ├── settings/
│   │   │   ├── page.tsx
│   │   │   └── _components/
│   │   ├── followers/
│   │   │   ├── page.tsx
│   │   │   └── _components/
│   │   └── showcase/               # 개발용 컴포넌트 목록 페이지
│   │       └── page.tsx
│   │
│   └── (public)/                   # SideNav 없는 비인증 페이지 그룹
│       ├── login/
│       │   ├── page.tsx
│       │   └── _components/
│       └── register/
│           ├── page.tsx
│           └── _components/
│
├── components/                     # 2개 이상 페이지에서 사용하는 공통 컴포넌트
│   ├── ui/                         # shadcn/ui 기반 primitive 컴포넌트
│   │   └── button.tsx
│   ├── SideNav.tsx
│   ├── KakaoMap.tsx
│   └── PostModal/                  # 복잡한 컴포넌트는 폴더로 분리
│       ├── PostModal.tsx
│       ├── SpotImages.tsx
│       ├── KebabMenu.tsx
│       └── index.ts                # barrel export
│
├── hooks/                          # 2개 이상 페이지에서 사용하는 공통 훅
│   └── useOnClickOutside.ts
│
├── lib/
│   ├── apiClient.ts                # ky 기반 API 클라이언트 (단일 진입점)
│   ├── config.ts                   # 환경변수 접근점
│   ├── queryKeys.ts                # TanStack Query 키 상수
│   └── utils.ts                   # cn() 유틸
│
├── mocks/                          # MSW 목 핸들러 (개발 환경 전용)
│   ├── browser.ts
│   └── handlers/
│       ├── index.ts
│       └── posts.ts
│
├── providers/
│   └── index.tsx                   # QueryClientProvider + MSW 초기화
│
├── store/                          # Zustand 전역 상태
│   ├── authStore.ts                # 인증 상태 (user 정보)
│   └── uiStore.ts                  # UI 상태 (모달 등)
│
└── types/
    ├── index.ts                    # 공통 타입 + 도메인 타입 re-export
    ├── post.types.ts               # 게시글 관련 타입
    └── kakao.d.ts                  # KakaoMap SDK 타입 선언
```

---

## 배치 기준

| 위치 | 기준 |
|------|------|
| `app/{page}/_components/` | 해당 페이지에서만 사용하는 컴포넌트 |
| `app/{page}/_hooks/` | 해당 페이지에서만 사용하는 훅 |
| `components/` | 2개 이상의 페이지에서 사용하는 컴포넌트 |
| `components/ui/` | shadcn/ui 기반 primitive (Button, Input 등) |
| `hooks/` | 2개 이상의 페이지에서 사용하는 훅 |
| `store/` | 전역 클라이언트 상태 (Zustand) |
| `lib/` | API 클라이언트, 환경변수, 유틸 함수 |
| `types/` | 전역 타입 및 도메인 타입 |

> `_` 접두사 폴더는 Next.js가 라우트로 인식하지 않습니다.

---

## 판단 기준 흐름

```
이 컴포넌트/훅이 여러 페이지에서 쓰이는가?
        │
       YES → components/ 또는 hooks/
        │
        NO → 해당 라우트 폴더 내 _components/ 또는 _hooks/
```

---

## 컴포넌트 파일 구조

컴포넌트가 단일 파일로 충분한 경우:
```
components/
└── KakaoMap.tsx
```

컴포넌트가 복잡해져 분리가 필요한 경우:
```
components/
└── PostModal/
    ├── PostModal.tsx
    ├── SpotImages.tsx
    ├── KebabMenu.tsx
    └── index.ts        # barrel export
```
