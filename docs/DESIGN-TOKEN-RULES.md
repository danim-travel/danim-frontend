# Danim Design Token Rules

디자인 토큰의 네이밍·구조·참조 규칙을 정의합니다.

---

## 토큰 계층

```
Primitive → Semantic → Component → State
```

각 계층은 반드시 상위 계층의 토큰을 `var()`로 참조합니다. 실제 값(HEX, px 등)은 Primitive에만 씁니다.

---

## 네이밍 구조

### Primitive — `--{category}-{scale}`

원시 값. 실제 HEX / px / shadow 값을 직접 선언합니다.

```css
--color-mint-500: #3ECBA0;
--color-gray-900: #0F1720;
--radius-md:      12px;
--shadow-sm:      0 2px 8px rgba(17, 24, 39, 0.06);
--space-4:        16px;
--font-weight-bold: 700;
```

### Semantic — `--{role}-{property}-{level?}`

의미 기반 역할. Primitive를 `var()`로 참조합니다.

```css
--color-primary:       var(--color-mint-500);
--color-bg:            var(--color-gray-100);
--color-bg-card:       var(--color-white);
--color-text:          var(--color-gray-900);
--color-text-muted:    var(--color-gray-500);
--color-border:        var(--color-gray-200);
--color-border-focus:  var(--color-primary);
--color-error:         var(--color-red-500);
```

### Component — `--{component}-{variant?}-{property}`

컴포넌트 기본(default) 상태 토큰. Semantic 토큰을 `var()`로 참조합니다.

```css
--button-primary-bg:   var(--color-primary);
--button-primary-text: var(--color-text-inverse);
--input-border:        var(--color-border);
--chip-radius:         var(--radius-pill);
```

### State — `--{component}-{variant?}-{property}-{state}`

컴포넌트 비기본 상태 토큰. **property가 state 앞에** 옵니다.

```css
--button-primary-bg-hover:     var(--color-primary-hover);
--button-primary-bg-disabled:  var(--color-border);
--button-primary-shadow-focus: var(--shadow-focus-ring);
--input-border-focus:          var(--color-border-focus);
--chip-bg-selected:            var(--color-primary);
```

---

## Property 약어 규칙

| 의미 | 토큰 property |
|------|------------|
| background | `bg` |
| color / text | `text` |
| spacing / gap | `gap` |
| dim / overlay | `overlay` |
| focus / ring | `ring` |
| border | `border` |
| icon | `icon` |
| shadow | `shadow` |
| border-radius | `radius` |
| padding | `padding` |
| height | `height` |
| width | `width` |
| opacity | `opacity` |
| placeholder | `placeholder` |

**금지**: `b`, `c`, `bd`, `sh`, `rad`, `ov` 등 모호한 단일 문자 / 약어.

---

## 파일 구조

```
src/styles/tokens/
├── colors.css          # Primitive + Semantic 컬러 (@theme inline)
├── typography.css      # Primitive + Semantic 타이포 (@theme inline)
├── spacing.css         # Primitive + Semantic 스페이싱 (@theme inline)
├── radius.css          # Primitive + Semantic 라디우스 (@theme inline)
├── shadow.css          # Primitive + Semantic 그림자 (@theme inline)
└── component-state.css # Component + State 토큰 (:root)
```

- `@theme inline` → Tailwind 유틸리티 클래스로 자동 노출됨
- `:root` → `var(--token-name)` 으로만 접근

---

## 참조 규칙

```
✅ Semantic이 Primitive를 참조  →  --color-primary: var(--color-mint-500)
✅ Component가 Semantic을 참조  →  --button-primary-bg: var(--color-primary)
✅ State가 Semantic을 참조      →  --button-primary-bg-hover: var(--color-primary-hover)

❌ Component가 Primitive를 직접 참조  →  --button-primary-bg: #3ECBA0
❌ Semantic이 Component를 참조        →  --color-bg: var(--button-primary-bg)
❌ 코드에 HEX/px 하드코딩            →  color: #3ECBA0
```

---

## Tailwind 연동

`@theme inline` 블록의 `--color-{name}` 토큰은 Tailwind 유틸리티 클래스로 노출됩니다.

```css
/* colors.css */
--color-primary: var(--color-mint-500);  /* → bg-primary, text-primary, border-primary */
--color-bg-card: var(--color-white);     /* → bg-bg-card */
--color-text-muted: var(--color-gray-500); /* → text-text-muted */
```

컴포넌트에서는 Tailwind 클래스로 사용합니다.

```tsx
<div className="bg-bg-card border border-border-subtle text-text-muted" />
```
