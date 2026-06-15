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
│   ├── icon.svg                    # Next.js App Router 자동 파비콘 등록
│   │
│   ├── (main)/                     # SideNav가 있는 인증 필요 페이지 그룹
│   │   ├── layout.tsx              # SideNav + AuthGuard 적용 레이아웃
│   │   ├── page.tsx                # 홈 (팔로잉 피드 + 지도)
│   │   ├── _components/            # (main) 전용 공통 컴포넌트
│   │   │   ├── AuthGuard.tsx           # 비로그인 사용자 /login 리다이렉트
│   │   │   ├── FeedCard.tsx            # 피드 포스트 카드
│   │   │   ├── FeedPanel.tsx           # 좌측 팔로잉 피드 패널
│   │   │   ├── MapPanel.tsx            # 우측 카카오맵 패널
│   │   │   └── SearchDrawer.tsx        # 유저 검색 드로어 (SideNav 아이콘으로 토글)
│   │   ├── _hooks/                 # (main) 전용 공통 훅
│   │   │   ├── useMainFeed.ts
│   │   │   ├── usePinColor.ts
│   │   │   └── usePrefetchPostDetail.ts
│   │   ├── explore/
│   │   │   ├── page.tsx
│   │   │   ├── _components/
│   │   │   └── _hooks/
│   │   ├── posts/
│   │   │   └── [postId]/
│   │   │       └── page.tsx        # 포스트 상세 (공유 링크용)
│   │   ├── write/
│   │   │   ├── page.tsx            # 게시글 작성
│   │   │   ├── [postId]/
│   │   │   │   └── edit/
│   │   │   │       └── page.tsx    # 게시글 수정
│   │   │   ├── _components/        # 작성/수정 공용 폼 컴포넌트
│   │   │   ├── _constants.ts
│   │   │   ├── _helpers/
│   │   │   ├── _hooks/
│   │   │   └── _types/
│   │   ├── dm/
│   │   │   ├── layout.tsx          # 좌측 ConversationList 고정, 우측 {children}
│   │   │   ├── page.tsx            # 대화방 미선택 상태
│   │   │   ├── [roomId]/
│   │   │   │   └── page.tsx        # 특정 대화방
│   │   │   └── _components/
│   │   ├── mypage/
│   │   │   ├── page.tsx
│   │   │   ├── _components/
│   │   │   └── _hooks/
│   │   ├── users/
│   │   │   └── [userId]/
│   │   │       ├── page.tsx        # 타인 프로필 조회
│   │   │       └── _components/
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
│       ├── _components/            # (public) 전용 공통 UI (AuthCard, BrandPanel 등)
│       ├── _constants/             # (public) 그룹 공통 상수 (이메일·비밀번호 규칙 등)
│       ├── _hooks/                 # (public) 그룹 공통 훅 (useEmailVerification 등)
│       ├── login/
│       │   ├── page.tsx
│       │   └── _components/
│       ├── register/
│       │   ├── page.tsx
│       │   ├── _components/
│       │   ├── _constants/         # 닉네임·생년월일 유효성 규칙
│       │   ├── _hooks/             # useNicknameCheck
│       │   └── _schema.ts          # Zod 회원가입 스키마
│       ├── reset-password/
│       │   ├── page.tsx
│       │   ├── _components/
│       │   ├── _hooks/
│       │   └── _schema.ts
│       └── social-callback/
│           ├── page.tsx
│           └── _components/
│
├── components/                     # 2개 이상 페이지에서 사용하는 공통 컴포넌트
│   ├── ui/                         # shadcn/ui 기반 primitive 컴포넌트
│   │   └── spinner.tsx
│   ├── common/                     # 디자인 시스템 공통 컴포넌트
│   │   ├── Avatar/
│   │   ├── Badge/
│   │   ├── Button/
│   │   ├── Modal/
│   │   ├── SideDrawer/
│   │   ├── Tabs/
│   │   ├── Toast/
│   │   ├── feedback/               # EmptyState, Skeleton
│   │   ├── index.ts                # barrel export
│   │   └── ...                     # TextField, SearchBar, Checkbox 등
│   ├── layout/
│   │   └── BottomTabBar.tsx
│   ├── SideNav.tsx
│   ├── KakaoMap.tsx
│   └── PostModal/                  # 복잡한 컴포넌트는 폴더로 분리
│       ├── PostModal.tsx
│       ├── PostModalContext.tsx
│       ├── ActionBar.tsx
│       ├── CommentSection.tsx
│       ├── CommentItem.tsx
│       ├── CommentInputBar.tsx
│       ├── DetailPane.tsx
│       ├── ImagePane.tsx
│       ├── SpotContent.tsx
│       ├── SpotImages.tsx
│       ├── KebabMenu.tsx
│       ├── menuBuilder.tsx
│       ├── constants.ts
│       └── index.ts                # barrel export
│
├── hooks/                          # 2개 이상 페이지에서 사용하는 공통 훅
│   ├── useBookmarkMutation.ts
│   ├── useCommentMutations.ts
│   ├── useCommentsQuery.ts
│   ├── useLikeMutation.ts
│   ├── useOnClickOutside.ts
│   ├── usePostDetail.ts
│   └── useScrollLock.ts
│
├── lib/
│   ├── api/                        # 도메인별 API 함수 (apiClient 경유)
│   │   ├── auth.ts
│   │   ├── posts.ts
│   │   └── users.ts
│   ├── apiClient.ts                # ky 기반 API 클라이언트 (단일 진입점)
│   ├── apiError.ts                 # ApiError 타입·createApiError·getApiErrorMessage
│   ├── config.ts                   # 환경변수 접근점 (process.env 직접 사용 금지)
│   ├── feedCache.ts
│   ├── queryKeys.ts                # TanStack Query 키 상수
│   ├── region.ts
│   ├── uploadImage.ts
│   └── utils.ts                   # cn() 유틸
│
├── mocks/                          # MSW 목 핸들러 (개발 환경 전용)
│   ├── browser.ts
│   ├── constants.ts
│   ├── lib/
│   │   └── mockState.ts
│   └── handlers/
│       ├── index.ts
│       ├── auth.ts
│       ├── comments.ts
│       ├── explore.ts
│       ├── interactions.ts
│       ├── mainFeed.ts
│       ├── notifications.ts
│       ├── posts.ts
│       └── users.ts
│
├── providers/
│   ├── index.tsx                   # QueryClientProvider + MSW 초기화 + AuthBootstrap
│   └── ToastProvider.tsx
│
├── store/                          # Zustand 전역 상태
│   ├── authStore.ts                # 인증 상태 (user 정보, accessToken)
│   ├── toastStore.ts               # 토스트 알림 상태
│   └── uiStore.ts                  # UI 상태 (activePanel 등)
│
└── types/
    ├── index.ts                    # 공통 타입 + 도메인 타입 re-export
    ├── comment.types.ts
    ├── interaction.types.ts
    ├── post.types.ts
    ├── user.types.ts
    └── kakao.d.ts                  # KakaoMap SDK 타입 선언
```

---

## 배치 기준

| 위치 | 기준 |
|------|------|
| `app/{page}/_components/` | 해당 페이지에서만 사용하는 컴포넌트 |
| `app/{page}/_hooks/` | 해당 페이지에서만 사용하는 훅 |
| `components/` | 2개 이상의 페이지에서 사용하는 컴포넌트 |
| `components/common/` | 디자인 시스템 공통 컴포넌트 |
| `components/ui/` | shadcn/ui 기반 primitive (Button, Input 등) |
| `hooks/` | 2개 이상의 페이지에서 사용하는 훅 |
| `lib/api/` | 도메인별 API 함수 (`apiClient` 경유) |
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
    ├── ...
    └── index.ts        # barrel export
```
