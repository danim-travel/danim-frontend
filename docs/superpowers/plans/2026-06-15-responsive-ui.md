# Responsive UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모바일(`< md`) / 데스크톱(`md+`) 반응형 UI를 구현한다 — 데스크톱은 기존 SideNav 유지, 모바일은 MobileHeader(상단) + MobileBottomNav(하단) 셸로 전환.

**Architecture:** Layout 레벨에서 SideNav(desktop) vs MobileHeader+MobileBottomNav(mobile)를 `md:` 브레이크포인트로 스위치. 각 페이지/컴포넌트에는 최소한의 반응형 클래스만 추가하고 데스크톱 UI 변경 없음.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, Framer Motion, Zustand, Lucide React

---

## File Map

| 파일 | 작업 |
|------|------|
| `src/styles/tokens/spacing.css` | `--z-bottom-nav: 30` 토큰 추가 |
| `src/components/layout/BottomTabBar.tsx` | `z-40` → `z-(--z-bottom-nav)` |
| `src/components/layout/MobileHeader.tsx` | 신규 생성 |
| `src/components/layout/MobileBottomNav.tsx` | 신규 생성 |
| `src/app/(main)/layout.tsx` | SideNav 숨김, MobileHeader/MobileBottomNav 삽입, main에 모바일 padding |
| `src/app/(main)/page.tsx` | 홈 페이지 wrapper 반응형 클래스 |
| `src/app/(main)/_components/FeedPanel.tsx` | 반응형 width/padding |
| `src/components/PostModal/PostModal.tsx` | 모바일 풀스크린 |
| `src/components/PostModal/ImagePane.tsx` | 모바일 수직 스택 height |
| `src/app/(main)/_components/SearchDrawer.tsx` | 모바일 full-width |
| `src/app/(main)/explore/_components/ExploreGrid.tsx` | `columns-2 md:columns-4` |
| `src/app/(main)/mypage/_components/ProfileHeader.tsx` | 반응형 레이아웃 + 설정 버튼(모바일) |
| `src/components/common/PageContainer.tsx` | 반응형 padding |

---

## Task 1: 디자인 토큰 — z-bottom-nav 추가

**Files:**
- Modify: `src/styles/tokens/spacing.css`

- [ ] **Step 1: z-index 토큰 추가**

`src/styles/tokens/spacing.css`의 Z-index 블록에 한 줄 추가:
```css
--z-bottom-nav:  30;
```
기존:
```css
--z-sidenav:    10;
--z-drawer:      5;
--z-page-modal: 40;
--z-modal:      100;
```
변경 후:
```css
--z-sidenav:    10;
--z-drawer:      5;
--z-bottom-nav:  30;
--z-page-modal: 40;
--z-modal:      100;
```

---

## Task 2: BottomTabBar z-index 수정

**Files:**
- Modify: `src/components/layout/BottomTabBar.tsx`

- [ ] **Step 1: z-40 → z-(--z-bottom-nav)**

```tsx
<nav className="fixed bottom-0 left-0 right-0 h-16 flex items-center justify-around bg-bg-card border-t border-border px-2 z-(--z-bottom-nav)">
```

---

## Task 3: MobileHeader 컴포넌트 생성

**Files:**
- Create: `src/components/layout/MobileHeader.tsx`

- [ ] **Step 1: 컴포넌트 생성**

```tsx
"use client";

import Link from "next/link";
import { Search, Bell } from "lucide-react";
import { useUIStore } from "@/store/uiStore";

export function MobileHeader() {
  const { activePanel, setActivePanel, closePanel } = useUIStore();

  return (
    <header className="fixed top-0 inset-x-0 h-14 z-(--z-sidenav) bg-bg-card border-b border-border flex items-center justify-between px-4 md:hidden">
      <Link href="/" className="flex items-center">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-md">
          <span className="text-text-inverse text-sm">✈️</span>
        </div>
      </Link>

      <div className="flex items-center gap-1">
        <button
          onClick={() => activePanel === "search" ? closePanel() : setActivePanel("search")}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-bg-subtle transition-colors"
          aria-label="검색"
        >
          <Search className="w-5 h-5 text-text-muted" strokeWidth={2} />
        </button>
        <button
          onClick={() => setActivePanel("notification")}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-bg-subtle transition-colors"
          aria-label="알림"
        >
          <Bell className="w-5 h-5 text-text-muted" strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
```

---

## Task 4: MobileBottomNav 컴포넌트 생성

**Files:**
- Create: `src/components/layout/MobileBottomNav.tsx`

- [ ] **Step 1: 컴포넌트 생성**

```tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, Compass, PenLine, MessageCircle, User } from "lucide-react";
import { BottomTabBar } from "./BottomTabBar";

const NAV_ITEMS = [
  { key: "/", label: "홈", icon: <Home size={22} strokeWidth={2} />, href: "/" },
  { key: "/explore", label: "탐색", icon: <Compass size={22} strokeWidth={2} />, href: "/explore" },
  { key: "/write", label: "기록", icon: <PenLine size={22} strokeWidth={2} />, href: "/write", primary: true },
  { key: "/dm", label: "메시지", icon: <MessageCircle size={22} strokeWidth={2} />, href: "/dm" },
  { key: "/mypage", label: "MY", icon: <User size={22} strokeWidth={2} />, href: "/mypage" },
];

function getActiveKey(pathname: string): string {
  if (pathname === "/") return "/";
  return NAV_ITEMS.find((item) => item.key !== "/" && pathname.startsWith(item.key))?.key ?? "";
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const active = getActiveKey(pathname);

  return (
    <div className="md:hidden">
      <BottomTabBar
        items={NAV_ITEMS}
        active={active}
        onNav={(key) => router.push(key)}
      />
    </div>
  );
}
```

---

## Task 5: (main)/layout.tsx — 셸 반응형

**Files:**
- Modify: `src/app/(main)/layout.tsx`

- [ ] **Step 1: 레이아웃 수정**

```tsx
import SideNav from "@/components/SideNav";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { AuthGuard } from "./_components/AuthGuard";
import { SearchDrawer } from "./_components/SearchDrawer";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-full relative">
        {/* 데스크톱 전용 SideNav */}
        <div className="hidden md:block relative z-(--z-sidenav) shrink-0 h-full">
          <SideNav />
        </div>

        {/* 모바일 전용 상단 헤더 */}
        <MobileHeader />

        {/* 콘텐츠 영역 — 모바일: 상단/하단 fixed UI 높이만큼 padding */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto overscroll-contain pt-14 md:pt-0 pb-16 md:pb-0">
          {children}
        </main>

        {/* 모바일 전용 하단 탭바 */}
        <MobileBottomNav />

        <SearchDrawer />
      </div>
    </AuthGuard>
  );
}
```

---

## Task 6: 홈 페이지 반응형 레이아웃

**Files:**
- Modify: `src/app/(main)/page.tsx`
- Modify: `src/app/(main)/_components/FeedPanel.tsx`

- [ ] **Step 1: FeedPanel 반응형 내부 스타일**

`FeedPanel.tsx`의 `<aside>` className 수정:
```tsx
<aside className="w-full md:w-(--panel-width) p-4 md:p-7 shrink-0 h-full flex flex-col bg-bg-subtle rounded-2xl overflow-hidden shadow-sm">
```
변경 내용: `w-(--panel-width)` → `w-full md:w-(--panel-width)`, `p-7` → `p-4 md:p-7`

- [ ] **Step 2: 홈 페이지 wrapper 반응형 레이아웃**

`page.tsx`의 return 블록에서 최상위 div를 wrapper div 구조로 교체:
```tsx
return (
  <div className="flex flex-col h-full md:flex-row md:gap-4 md:p-4 md:bg-bg">
    {/* 피드: 모바일=하단(order-last, h-1/2), 데스크톱=좌(order-first) */}
    <div className="order-last h-1/2 shrink-0 md:order-first md:h-full">
      <FeedPanel
        posts={posts}
        focusedPostId={activeFocusedPost?.post.post_id ?? null}
        onSelectPost={handleSelectPost}
        onOpenModal={handleOpenModal}
        onLoadMore={handleLoadMore}
        isLoading={isLoading && !soloPostId}
        hasNextPage={soloPostId ? false : hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        title={soloPostId ? "피드" : undefined}
        onBack={soloPostId ? () => router.back() : undefined}
      />
    </div>

    {/* 지도: 모바일=상단(order-first, flex-1), 데스크톱=우(order-last, flex-1) */}
    <div className="order-first flex-1 min-h-0 md:order-last">
      <MapPanel
        focusedPost={activeFocusedPost}
        focusedPostIndex={activeFocusedPostIndex}
        onPinClick={handlePinClick}
        onResetFocus={() => setFocusedPost(null)}
      />
    </div>

    <AnimatePresence>
      {postId && (
        <PostModal
          postId={postId}
          initialSpotIdx={spotIdx}
          onClose={handleCloseModal}
        />
      )}
    </AnimatePresence>
  </div>
);
```

---

## Task 7: PostModal 모바일 풀스크린

**Files:**
- Modify: `src/components/PostModal/PostModal.tsx`
- Modify: `src/components/PostModal/ImagePane.tsx`

- [ ] **Step 1: PostModal inner div 반응형**

`PostModal.tsx`에서 내부 `motion.div`(data-testid="post-modal") className 수정:
```tsx
<motion.div
  data-testid="post-modal"
  className="bg-bg-card rounded-none md:rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-[0_32px_80px_-12px_rgba(0,0,0,0.35)] w-full h-full md:w-[1000px] md:max-w-[96vw] md:h-auto md:max-h-[92vh] relative"
  onClick={(e) => e.stopPropagation()}
  initial={{ opacity: 0, scale: 0.95, y: 8 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.95, y: 8 }}
  transition={{ duration: 0.2 }}
>
```

- [ ] **Step 2: ImagePane 모바일 height**

`ImagePane.tsx`의 `<div>` className 수정:
```tsx
<div className="w-full h-[45%] shrink-0 md:w-1/2 md:h-auto flex flex-col overflow-hidden bg-bg-subtle">
```

---

## Task 8: SearchDrawer 모바일 full-width

**Files:**
- Modify: `src/app/(main)/_components/SearchDrawer.tsx`

- [ ] **Step 1: SideDrawer className 반응형**

`SearchDrawer.tsx`에서 `<SideDrawer>` className prop 수정:
```tsx
<SideDrawer
  open={isOpen}
  onClose={handleClose}
  title="검색"
  className="left-0 w-full md:left-(--sidebar-width) md:w-[calc(var(--panel-width)+20px)] z-(--z-drawer)"
>
```

---

## Task 9: ExploreGrid 반응형 컬럼

**Files:**
- Modify: `src/app/(main)/explore/_components/ExploreGrid.tsx`

- [ ] **Step 1: columns-4 → columns-2 md:columns-4**

`ExploreGrid.tsx`에서 `columns-4` 클래스를 모두 `columns-2 md:columns-4`로 교체 (3곳):

1. 로딩 스켈레톤 div: `className="columns-2 md:columns-4 gap-3"`
2. 게시글 그리드 div: `className="columns-2 md:columns-4 gap-3"`
3. 추가 로딩 div: `className="columns-2 md:columns-4 gap-3 mt-0"`

---

## Task 10: ProfileHeader 반응형 + 설정 버튼

**Files:**
- Modify: `src/app/(main)/mypage/_components/ProfileHeader.tsx`

- [ ] **Step 1: ProfileHeader 반응형 레이아웃 + 설정 버튼**

```tsx
"use client";
import Link from "next/link";
import { Settings } from "lucide-react";
import { Avatar } from "@/components/common";
import type { UserProfileResponse } from "@/types";

export interface ProfileHeaderProps {
  profile: UserProfileResponse;
}

interface StatItemProps {
  label: string;
  value: number;
  href?: string;
}

function formatCount(n: number): string {
  if (n < 1000) return String(n);
  const compact = (value: number, unit: string) => {
    const formatted = value.toFixed(1).replace(/\.0$/, "");
    return `${formatted}${unit}`;
  };
  if (n < 1_000_000) return compact(n / 1_000, "K");
  if (n < 1_000_000_000) return compact(n / 1_000_000, "M");
  return compact(n / 1_000_000_000, "B");
}

function StatItem({ label, value, href }: StatItemProps) {
  const content = (
    <>
      <div className="text-xl font-bold text-text">{formatCount(value)}</div>
      <div className="text-xs text-text-muted mt-1">{label}</div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="flex flex-col items-center bg-bg rounded-xl px-4 py-3 w-[120px] md:w-[160px] hover:bg-bg-subtle transition-colors">
        {content}
      </Link>
    );
  }

  return (
    <div className="flex flex-col items-center bg-bg rounded-xl px-4 py-3 w-[120px] md:w-[160px]">
      {content}
    </div>
  );
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const initial = profile.nickname?.slice(0, 1).toUpperCase() ?? "?";

  return (
    <section className="relative bg-bg-card rounded-2xl p-5 md:p-6">
      {/* 모바일 전용 설정 버튼 */}
      <Link
        href="/settings"
        className="absolute top-4 right-4 md:hidden w-8 h-8 flex items-center justify-center rounded-xl hover:bg-bg-subtle transition-colors"
        aria-label="설정"
      >
        <Settings className="w-5 h-5 text-text-muted" strokeWidth={2} />
      </Link>

      <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
        <Avatar size="xl" src={profile.profile_img || undefined} initial={initial} />

        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-text">{profile.nickname}</h2>
          {profile.name && (
            <p className="text-xs text-text-muted mt-0.5">{profile.name}</p>
          )}
          {profile.intro && (
            <p className="text-sm text-text-muted mt-1 whitespace-pre-wrap">
              {profile.intro}
            </p>
          )}

          {/* 통계: 모바일에서는 프로필 정보 아래 */}
          <div className="flex gap-3 mt-4">
            <StatItem label="팔로워" value={profile.follower} href="/followers?tab=followers" />
            <StatItem label="팔로잉" value={profile.following} href="/followers?tab=following" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProfileHeader;
```

---

## Task 11: PageContainer 반응형 패딩

**Files:**
- Modify: `src/components/common/PageContainer.tsx`

- [ ] **Step 1: 반응형 padding**

```tsx
interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className="h-full overflow-y-auto">
      <div className={`max-w-6xl mx-auto px-4 py-6 md:px-6 md:py-8 ${className ?? ""}`}>
        {children}
      </div>
    </div>
  );
}
```

---

## Self-Review

### Spec Coverage

| 요구사항 | 구현 태스크 |
|---------|------------|
| 데스크톱 SideNav 유지 | Task 5 (layout hidden md:block) |
| 모바일 하단 네비게이션 | Task 3, 4, 5 |
| 알림 버튼 → 상단 헤더 | Task 3 (MobileHeader) |
| 설정 → 마이페이지 접근 | Task 10 (ProfileHeader) |
| 홈 지도+피드 오버레이 | Task 6 |
| PostModal 풀스크린 | Task 7 |
| SearchDrawer full-width | Task 8 |
| ExploreGrid 반응형 | Task 9 |
| ProfileHeader 반응형 | Task 10 |
| PageContainer 패딩 | Task 11 |
| z-index 충돌 방지 | Task 1, 2 |

### 타입/메서드 일관성
- `BottomTabItem.key` 는 href와 동일한 값 사용 — `onNav(key)` 에서 `router.push(key)` 직접 사용 가능
- `MobileBottomNav`에서 import하는 `BottomTabBar`의 props 인터페이스와 일치

### Placeholder 없음 ✓
