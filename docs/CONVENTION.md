# 컨벤션 가이드

## 브랜치 네이밍

```
<type>/<이슈번호>--<간단한-설명>
```

| 타입 | 설명 |
| --- | --- |
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `refactor` | 리팩토링 |
| `docs` | 문서 |
| `chore` | 빌드, 설정, 기타 |
| `style` | UI/스타일 변경 |
| `test` | 테스트 |

**예시**

```
feat/12--login-page
fix/15--auth-token-expired
docs/3--add-convention
```

---

## Git 커밋 메시지

```
<type>: <설명> (#이슈번호)
```

- 타입은 소문자, 설명은 한국어 또는 영어
- 허용 타입: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore`, `build`, `ci`, `perf`
- 이슈 번호는 관련 이슈가 있을 때만 포함

**예시**

```
feat: 로그인 기능 추가 (#12)
fix: 토큰 만료 오류 수정 (#15)
docs: CONVENTION.md 추가
chore: 패키지 버전 업데이트
```

> `commit-msg` 훅에서 형식 자동 검증됨 (`<type>: <설명>` 미준수 시 커밋 차단)

---

## Git 이슈

이슈 타입은 두 가지입니다.

### Bug Report

- **제목 형식:** `bug: <버그 설명>`
- **필수 항목:** 버그 설명, 재현 방법, 기대 동작, 실제 동작
- **선택 항목:** 스크린샷, 환경 (브라우저)

### Feature Request

- **제목 형식:** `feat: <기능 설명>`
- **필수 항목:** 기능 설명, 필요한 이유
- **선택 항목:** 제안하는 해결 방법, 대안, 추가 정보

---

## Pull Request

**베이스 브랜치**

- PR의 base 브랜치는 항상 `develop` (명시적으로 `main` 지정 시 제외)

**제목 형식**

```
<type>: <설명> (#이슈번호)
```

**예시**

```
feat: 로그인 페이지 구현 (#12)
fix: 다크모드 토글 버그 수정 (#18)
```

**본문 구성** (`pull_request_template.md` 기준)

```markdown
## 관련 이슈

- closes #이슈번호

## 작업 내용

-

## 변경 사항

-

## 스크린샷 (선택)

## 체크리스트

- [ ] 코드가 정상적으로 동작하는지 확인했습니다
- [ ] 불필요한 console.log 또는 디버깅 코드를 제거했습니다
- [ ] 컨벤션에 맞게 작성했습니다
```

---

## Git Hooks

Husky + lint-staged로 자동화되어 있음.

| 훅 | 실행 시점 | 동작 |
| --- | --- | --- |
| `pre-commit` | 커밋 직전 | staged `.ts/.tsx` ESLint 검사 |
| `commit-msg` | 커밋 메시지 작성 후 | 메시지 형식 검증 (미준수 시 커밋 차단) |
| `pre-push` | 푸시 직전 | `pnpm build` 실행 — 타입 체크 포함 (빌드 실패 시 푸시 차단) |

---

## 파일 / 폴더 네이밍

| 대상 | 형식 | 예시 |
| --- | --- | --- |
| 컴포넌트 파일 | PascalCase | `LoginForm.tsx`, `UserCard.tsx` |
| 컴포넌트 폴더 | PascalCase | `LoginForm/`, `UserCard/` |
| 페이지 컴포넌트 | Next.js 고정 파일명 | `page.tsx`, `layout.tsx` |
| 훅 | camelCase + `use` prefix | `useAuth.ts`, `useUserQuery.ts` |
| 스토어 | camelCase + `Store` suffix | `authStore.ts`, `uiStore.ts` |
| 유틸 / 헬퍼 | camelCase | `formatDate.ts`, `validateEmail.ts` |
| 상수 | camelCase | `queryKeys.ts`, `config.ts` |
| 타입 / 인터페이스 파일 | camelCase | `user.types.ts`, `auth.types.ts` |
| CSS / 스타일 | camelCase | `globals.css` |
| 일반 폴더 | kebab-case | `mocks/`, `mock-handlers/` |

**컴포넌트 디렉토리 구조**

```
src/components/
└── ButtonGroup/
    ├── ButtonGroup.tsx   # 컴포넌트 본체
    └── index.ts          # barrel export
```

**barrel export (`index.ts`) 사용 범위**

- `src/components/`, `src/types/`, `src/lib/` 등 **여러 페이지에서 공용으로 import되는 모듈**에서만 사용
- `src/app/` 내부(`_components/`, `_hooks/`)에서는 **사용하지 않음** — 해당 페이지에서만 쓰이므로 직접 import
