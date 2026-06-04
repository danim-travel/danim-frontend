# 프론트엔드 라우팅

## 그룹 구조

Next.js App Router의 Route Group으로 레이아웃을 분리합니다.

| 그룹 | 경로 | 특징 |
|------|------|------|
| `(public)` | `/login`, `/register`, `/reset-password`, `/social-callback` | SideNav 없음, 비인증 접근 가능 |
| `(main)` | 그 외 모든 페이지 | SideNav 좌측 고정, 인증 필요 |

---

## 페이지 라우팅

### (public) 그룹

| URL | 설명 |
|-----|------|
| `/login` | 로그인 (이메일 + 소셜) |
| `/register` | 회원가입 (이메일·SMS 인증 포함) |
| `/reset-password` | 비밀번호 재설정 (이메일 인증 코드 + 새 비밀번호 설정) |
| `/social-callback` | 소셜 로그인 콜백 수신 (`?provider=&is_success=`) |

### (main) 그룹

| URL | 설명 |
|-----|------|
| `/` | 홈: 팔로잉 피드(좌) + 카카오맵(우) |
| `/explore` | 탐색: 지역 검색 + 마소너리 그리드 |
| `/write` | 게시글 작성 |
| `/write/[postId]/edit` | 게시글 수정 |
| `/mypage` | 내 프로필: 프로필 + 뱃지 + 게시글 그리드 |
| `/users/[userId]` | 타인 프로필 조회 |
| `/settings` | 설정: 프로필 편집, 비밀번호, 탈퇴 |
| `/followers` | 팔로워 / 팔로잉 목록 |
| `/dm` | DM 목록 (대화방 미선택 상태) |
| `/dm/[roomId]` | 특정 대화방 |
| `/showcase` | 개발용 컴포넌트 목록 (개발 환경 전용) |

---

## DM 레이아웃 구조

`/dm`과 `/dm/[roomId]`는 `dm/layout.tsx`를 공유합니다.

```
dm/layout.tsx
├── 좌측: ConversationList (항상 고정)
└── 우측: {children}
      ├── /dm          → page.tsx (대화방 미선택 안내)
      └── /dm/[roomId] → [roomId]/page.tsx (채팅방)
```

---

## 드로어

페이지 이동 없이 현재 페이지 위에 오버레이로 표시되는 UI입니다.

| 드로어 | 트리거 | 상태 |
|--------|--------|------|
| `SearchDrawer` | SideNav 검색 아이콘 | `uiStore.isSearchOpen` |
| `NotificationDrawer` | SideNav 알림 아이콘 | `uiStore.isNotificationOpen` |

두 드로어 모두 `(main)/layout.tsx`에 마운트됩니다.
