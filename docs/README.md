# docs/ — Danim 시스템 문서

여행 경로를 지도에 기록하고 공유하는 소셜 플랫폼 **danim**의 팀 공유 문서 모음.

## 문서 계층 (Tier)

### 기준 문서 (Tier 1 — 절대 기준)
- `../CLAUDE.md` — Claude Code 가이드 + 핵심 규칙 (진입점)

### 컨벤션/워크플로우 (Tier 2 — 작업 절차)
- `CONVENTION.md` — 브랜치·커밋·PR 컨벤션

### 구조/라우팅 (Tier 3 — 참조)
- `PROJECT_STRUCTURE.md` — 폴더 구조 규칙
- `ROUTING.md` — 프론트엔드 페이지 라우팅
- `카카오맵-가이드.md` — KakaoMap SDK 사용 가이드
- `DESIGN-TOKEN-RULES.md` — 색상·디자인 토큰 규칙

## 로컬 전용 문서

`docs/local/` 폴더는 `.gitignore` 처리된 개인·AI 작업 문서입니다.

| 파일/폴더 | 내용 |
|-----------|------|
| `AI_AGENT_RULES.md` | AI 행동 제약 |
| `GIT_WORKFLOW.md` | Git 브랜치 전략 |
| `QA_AND_DONE.md` | 완료 정의·검증 파이프라인 |
| `DEVELOPMENT_GUIDE.md` | 개발 환경 세팅·작업 사이클 |
| `REGISTER_FLOW.md` | 회원가입 플로우 코드 분석 |
| `ARCHITECTURE.md` | 시스템 아키텍처 |
| `SSOT.md` | 프로젝트 단일 진실 원천 |
| `tickets/` | 로컬 작업 티켓 |
| `screens/` | 화면 정의서 |
| `scratch/` | 임시 메모·디버깅 |
| `logs/` | 작업 로그 |

## 빠른 참조

| 궁금한 것 | 문서 |
|-----------|------|
| 브랜치 이름 규칙 | `CONVENTION.md` |
| 커밋 메시지 형식 | `CONVENTION.md` |
| PR 만드는 법 | `CONVENTION.md`, `/pr` 커맨드 |
| 폴더 어디에 파일 두나 | `PROJECT_STRUCTURE.md` |
| 페이지 URL 목록 | `ROUTING.md` |
| KakaoMap 사용법 | `카카오맵-가이드.md` |
| 색상 토큰 사용법 | `DESIGN-TOKEN-RULES.md` |
| AI가 해야 할 것 / 금지 | `docs/local/AI_AGENT_RULES.md` |
| 티켓 양식 | `docs/local/tickets/_TEMPLATE.md` |
| 화면 정의서 양식 | `docs/local/screens/_TEMPLATE.md` |
