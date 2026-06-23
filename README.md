<div align="center">

<img src="public/readme/hero.svg" width="100%" alt="Danim — 세상의 모든 여행이 연결되는 곳"/>

<br/>

**여행을 기록하고, 여행자와 연결되고, 새로운 여행을 발견하세요.**

<br/>

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](#)
[![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](#)
[![Tailwind](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](#)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](#)

<br/>

[🌍 서비스 바로가기](https://danim.kr) &nbsp;·&nbsp; [🐛 버그 제보](../../issues) &nbsp;·&nbsp;

<br/>

</div>

---

<br/>

## 🤔 왜 다님인가요?

여행을 다녀와도 사진은 카메라 롤에만 잠들고, 좋았던 식당은 메모장에만 남아 있습니다.
인스타그램엔 올리기엔 너무 길고, 블로그는 쓰기엔 너무 번거롭습니다.

**다님은 이 공백을 채웁니다.**

| 기존의 불편함 | 다님의 해결 |
|---|---|
| 여행 기록이 사진첩에 흩어진다 | 일정·장소·사진을 한 곳에 구조화하여 기록 |
| 사진만 봐선 어디인지 모른다 | 카카오맵 위에 여행 경로가 마커·polyline으로 시각화 |
| 공유 링크 미리보기가 아쉽다 | SSR + OG 메타데이터로 카카오톡·트위터 공유에 풍부한 미리보기 |
| 모바일에서 끊기는 UX | iOS Safari·Android Chrome 호환성 직접 검증 — 70% 모바일 사용자 대응 |

<br/>

---

<br/>

## ✨ 핵심 기능

<br/>

> 다님은 여행의 모든 순간을 함께합니다.

<br/>

**🗺️ 여행 경로를 지도 위에 기록하세요**
방문한 장소마다 사진·위치·이야기를 남기면, 내 여행 동선이 지도 위에 그대로 펼쳐집니다.
어디서 어디로 이동했는지 한눈에 볼 수 있어요.

<br/>

**📸 스팟별로 나눠서 기록하세요**
한 여행을 여러 스팟으로 나눠 각 장소마다 사진과 글을 따로 남길 수 있어요.
순서를 바꾸고 싶으면 드래그해서 재배치하면 됩니다.

<br/>

**🔗 링크 하나로 바로 공유하세요**
내 여행 기록을 카카오톡이나 SNS에 공유하면, 받는 사람이 로그인 없이도 내용을 볼 수 있어요.
앱 안에서 클릭하면 모달로, 공유 링크로 들어오면 전용 페이지로 자연스럽게 열립니다.

<br/>

**💬 마음에 드는 여행자에게 DM을 보내세요**
좋아 보이는 식당, 숙소가 있으면 게시글 작성자에게 바로 메시지를 보낼 수 있어요.
이미지도 함께 보낼 수 있습니다.

<br/>

**🔔 반응을 실시간으로 확인하세요**
누군가 내 게시글에 좋아요·댓글을 달거나 팔로우하면 사이드바에 즉시 알림이 표시됩니다.

<br/>

---

<br/>

## 🚶 유저 여정

```
🔍 게시글 발견
  └─ 피드 / 탐색 / 카카오톡 공유 링크에서 카드를 만남

📖 게시글 읽기
  ├─ 앱 내 클릭   →  인터셉트 모달 (배경 페이지 유지 + URL 변경)
  └─ 공유 링크   →  SSR 풀페이지 (OG 미리보기 + 비로그인 게스트 뷰)

🗺️ 동선 따라가기
  └─ 카카오맵에서 마커·polyline으로 실제 여행 경로 확인 + 비행기 트랜지션

💬 연결되기
  ├─ 좋아요 / 북마크 (옵티미스틱 업데이트)
  ├─ 댓글 (이미지 첨부 가능)
  └─ 팔로우 →  DM →  실시간 알림

✏️ 직접 기록하기
  ├─ 스팟 단위 작성 (위치 검색 + 사진 + 텍스트)
  ├─ Pointer Events 기반 드래그로 스팟 순서 재배치
  └─ 자동 압축 업로드 (5MB →  380KB)
```

<br/>

---

<br/>

## 🏗️ 아키텍처

<br/>

### 데이터 흐름

```
Page / Component
    ├─ 서버 데이터  →  TanStack Query  →  ApiClient (ky)  →  Backend
    ├─ URL 상태    →  nuqs
    └─ UI 상태     →  Zustand
```

### 인터셉트 모달 + SSR 공개 페이지

```
앱 내 클릭 (router.push('/posts/[id]'))
    └─→ @modal/(...)posts/[id]/page.tsx  (인터셉트)
        └─→ PostModal 오버레이 (URL은 /posts/[id]로 변경, 배경 페이지 유지)

공유 URL 직접 진입 / 새로고침
    └─→ app/posts/[id]/page.tsx  (서버 컴포넌트, ISR 60초)
        ├─→ 비로그인: GuestPostView (OG 메타 + 게스트 뷰)
        └─→ 로그인: AuthRedirect → /?post=[id] (메인 모달로 자연 전환)
```

<br/>

---

<br/>

## 🛠️ 기술 스택

<div align="center">

<img src="public/readme/tech-stack.png" width="80%" alt="Danim Tech Stack"/>

</div>

<br/>

### Core
![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-F69220?style=flat-square&logo=pnpm&logoColor=white)

### Styling & UI
![Tailwind](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn/ui-000000?style=flat-square&logo=shadcnui&logoColor=white)
![Lucide](https://img.shields.io/badge/Lucide-F56565?style=flat-square&logo=lucide&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=flat-square&logo=framer&logoColor=white)

### State & Data
![TanStack Query](https://img.shields.io/badge/TanStack_Query_v5-FF4154?style=flat-square&logo=reactquery&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-443E38?style=flat-square)
![nuqs](https://img.shields.io/badge/nuqs-000000?style=flat-square)
![React Hook Form](https://img.shields.io/badge/React_Hook_Form-EC5990?style=flat-square&logo=reacthookform&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=flat-square&logo=zod&logoColor=white)

### Network & SDK
![ky](https://img.shields.io/badge/ky-000000?style=flat-square)
![KakaoMap](https://img.shields.io/badge/KakaoMap_SDK-FFCD00?style=flat-square&logo=kakao&logoColor=black)
![WebSocket](https://img.shields.io/badge/WebSocket-010101?style=flat-square&logo=socketdotio&logoColor=white)
![MSW](https://img.shields.io/badge/MSW-FF6A33?style=flat-square&logo=mockserviceworker&logoColor=white)

### DevOps & Quality
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=flat-square&logo=eslint&logoColor=white)
![Husky](https://img.shields.io/badge/Husky-1f425f?style=flat-square)

<br/>

---

<br/>

## 📂 폴더 구조

```
src/
├── app/                       # Next.js App Router
│   ├── (main)/                # 인증 필요 페이지 그룹 (AuthGuard 적용)
│   │   ├── _components/       # (main) 공유 컴포넌트
│   │   ├── _hooks/            # (main) 공유 훅
│   │   ├── dm/                # 실시간 DM
│   │   ├── explore/           # 탐색
│   │   ├── mypage/            # 마이페이지
│   │   ├── users/[userId]/    # 타인 프로필
│   │   ├── write/             # 게시글 작성·수정
│   │   └── page.tsx           # 메인 (피드 + 지도)
│   ├── (public)/              # 비로그인 페이지 그룹
│   │   ├── login/
│   │   ├── register/
│   │   └── reset-password/
│   ├── @modal/                # Parallel Route slot
│   │   └── (...)posts/[id]/   # 인터셉트 모달
│   ├── posts/[id]/            # SSR 공개 페이지 (OG 메타)
│   └── layout.tsx
├── components/
│   ├── PostModal/             # 게시글 모달 (도메인 폴더)
│   │   ├── _hooks/{post,comment}/
│   │   ├── _lib/{comment,routing}/
│   │   └── *.tsx
│   ├── common/                # 공통 UI primitive
│   ├── layout/                # 레이아웃 (헤더, 바텀나브)
│   └── KakaoMap.tsx
├── hooks/                     # 범용 훅
│   ├── async/                 # 디바운스, 무한스크롤
│   ├── ui/                    # 스크롤 락, 외부 클릭
│   └── interactions/          # 좋아요·북마크 mutation
├── lib/
│   ├── api/                   # 도메인별 API 함수
│   ├── media/                 # 이미지 압축·업로드
│   ├── apiClient.ts           # ky 인스턴스 (단일 진입점)
│   └── queryKeys.ts           # TanStack Query 키 중앙 관리
├── store/                     # Zustand (auth, ui, notification, toast)
└── types/                     # 전역 타입
```

<br/>

---

<br/>

## 🚀 시작하기

### 사전 요구사항
- Node.js 22+
- pnpm 9+

### 설치 및 실행

```bash
# 의존성 설치
pnpm install

# 환경변수 설정
cp .env.example .env.local
# NEXT_PUBLIC_API_URL, NEXT_PUBLIC_WS_URL,
# NEXT_PUBLIC_KAKAO_MAP_KEY, NEXT_PUBLIC_SITE_URL 입력

# 개발 서버 실행 (MSW 자동 활성화)
pnpm dev

# 프로덕션 빌드
pnpm build

# 타입 체크 & 린트
pnpm type-check
pnpm lint
```

### 환경변수

| 키 | 설명 | 예시 |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | 백엔드 REST API base URL | `https://api.danim.kr/v1/` |
| `NEXT_PUBLIC_WS_URL` | WebSocket base URL | `wss://api.danim.kr` |
| `NEXT_PUBLIC_KAKAO_MAP_KEY` | 카카오맵 JavaScript SDK 키 | `xxx` |
| `NEXT_PUBLIC_SITE_URL` | OG canonical URL 생성용 | `https://danim.kr` |

<br/>

---

<br/>

## 📱 주요 화면

<br/>

| 화면 | 설명 |
|---|---|
| **메인 (피드 + 지도)** | 팔로잉 피드를 무한스크롤로 보여주면서 우측에 카카오맵을 동시 표시. 카드를 클릭하면 지도가 해당 여행 경로로 비행기 트랜지션과 함께 이동 |
| **게시글 모달** | 좌측 사진 캐러셀 + 스팟 스텝퍼, 우측 본문·댓글·액션 바. 앱 내 클릭은 모달, 공유 링크 진입은 SSR 풀페이지로 분기 |
| **DM** | WebSocket 1:1 실시간 채팅. 이미지 첨부, 옵티미스틱 메시지 표시, 메시지 삭제 |
| **마이페이지 / 타인 프로필** | 게시글 그리드 + 저장됨(북마크) 탭, 팔로워·팔로잉 카운트, 프로필 이미지 없을 때 닉네임 이니셜 + 민트 배경 표시 |
| **작성 페이지** | 스팟 단위 폼(위치 검색 + 사진 업로드 + 텍스트) + Pointer Events 기반 순서 드래그 |
| **공유 페이지 (SSR)** | `generateMetadata`로 OG/Twitter 메타 동적 생성, ISR 60초, 비로그인 게스트 뷰 |

<br/>

---

<br/>

## 🗺️ 로드맵

- **v1.0 (현재)** — 피드·지도·작성·DM·실시간 알림·공유 페이지
- **v1.1** — 게시글 검색 고도화, 해시태그, 사용자 검색 자동완성
- **v1.2** — 위치 기반 추천, 비슷한 여행 스타일 사용자 추천
- **v2.0** — 모바일 PWA, 오프라인 작성 큐, 다국어 지원

<br/>

---

<br/>

## 👩‍💻 팀

<br/>

> 다님은 여행을 사랑하는 개발자들이 만들고 있습니다.

<br/>

### 프론트엔드

| 역할 | 이름 | GitHub |
|------|------|--------|
| | 김민재 | [@GAMMJ](https://github.com/GAMMJ) |
| | 정선영 | [@SunMyunC](https://github.com/SunMyunC) |

### 백엔드

| 역할 | 이름 | GitHub |
|------|------|--------|
| | 오디모데 | [@Di-Mo-De-OH](https://github.com/Di-Mo-De-OH) |
| | 고찬열 | [@kochanyeol](https://github.com/kochanyeol) |
| | 김건웅 | [@gunung-kim](https://github.com/gunung-kim) |
| | 손유진 | [@yoojinsohn](https://github.com/yoojinsohn) |
| | 최승용 | [@gumba6740](https://github.com/gumba6740) |

<br/>

---

<br/>

## 📄 라이선스

이 프로젝트는 내부 서비스용으로 별도 라이선스를 적용하지 않습니다.
코드 무단 복제 및 배포를 금합니다.

<br/>

---

<br/>

## 📬 문의

서비스 관련 문의나 협업 제안은 아래로 연락주세요.

- 이메일: `gammjmj@gmail.com`

<br/>

<div align="center">

<img src="public/readme/footer.svg" width="100%" alt="footer"/>

*세상의 모든 여행이 다님과 함께합니다* ✈️

</div>
