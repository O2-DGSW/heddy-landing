# O2 팀 코드 컨벤션 (heddy-landing 적용본)

heddy-app과 같은 O2 팀 규칙이다. Git·커밋·PR·이슈 규칙은 `.claude/skills/commit-pr/SKILL.md`에만 적는다(중복 방지).

## 네이밍

| 대상 | 규칙 | 예시 |
| --- | --- | --- |
| 컴포넌트/페이지 파일명 | PascalCase | `PhoneStage.tsx`, `LandingPage.tsx` |
| 엔트리 파일 | 고정 네이밍 | `index.ts`, Next 라우팅 파일(`page.tsx`, `layout.tsx`) |
| 토큰/스타일 값/util/api/model 파일 | camelCase | `motion.ts`, `scene.ts`, `formatDate.ts` |
| 폴더명 | kebab-case | `phone-stage/`, `section-record/` |
| 함수/변수명 | camelCase | `computePhones`, `sectionHeightVh` |
| 상수명 | SNAKE_CASE(대문자) | `TIMELINE`, `SECTION_KEYS`, `MOCK_RECORDS` |
| 이벤트 핸들러(내부 정의) | `handle` + 이벤트 | `handleClick`, `handleKeyDown` |
| 이벤트 콜백 props | `on` + 이벤트 | `onClick`, `onClose` |
| dummy 데이터 | `dummy` + 사용처 | `dummyRecords` |
| Boolean 변수 | `is`/`has`/`can`/`should` | `isMobile`, `isReducedMotion`, `hasDarkScreen` |
| Enum / Component 선언 | PascalCase | `enum ScreenKind { Home = 'home' }` |

> 목데이터 상수는 `SNAKE_CASE`(`MOCK_RECORDS`)와 `dummy` 접두어 중 하나로 통일한다 — 이 저장소는 export 상수라 `MOCK_RECORDS`처럼 SNAKE_CASE를 쓴다.

## 타입 (TypeScript)

- `interface`: 컴포넌트 Props
- `type`: API 응답 타입, 그 외 일반 타입(모션 결과값, 유니온 등)

```tsx
interface SectionShellProps {
  section: SectionKey;
  title: readonly string[];
}
export const SectionShell = (props: SectionShellProps) => { /* ... */ };

type PhonePose = { x: number; y: number; rotate: number; opacity: number; scale: number };
```

- JSX props는 중괄호 없이 큰따옴표: `<StoreButtons tone="dark" />`

## 스타일

- 정적 스타일이 3개 이상이면 인라인 스타일 금지 → Tailwind 클래스.
- 색상·폰트·반경은 디자인 토큰(`src/app/styles/tokens.css` → Tailwind `bg-main-50`, `text-label-assistive` 등)에서 가져온다. 임의 hex 금지(디자인 원본에 있는 값은 토큰에 추가 후 사용).
- 예외: 스크롤 프레임마다 바뀌는 `transform`/`opacity`/`clip-path` 등은 `useSceneFrame` 안에서 ref로 직접 쓴다(인라인 style prop 아님).

## Hooks

- 이름은 `use`로 시작, UI를 반환하지 않고 로직만 담는다. (`useSceneFrame`)

## import 순서

1. React
2. 외부 라이브러리 (`next/*` 포함)
3. 절대경로 (`@/…`)
4. 상대경로
5. style import
6. assets import (image, svg 등)

## API 호출

- 랜딩은 현재 서버 호출이 없다. 생기면 해당 슬라이스의 `api/` 세그먼트에 두고, 커스텀 axios 인스턴스는 `shared/api`에 하나만 만든다. 이미 있는 코드를 먼저 찾고 재사용한다.

## 주석

- 함수 상단에 함수 설명 주석(`/** … */`).
- 변수 옆 설명 주석 권장(특히 모션 수치: 무엇의 몇 % 구간인지).
- JSX 내부 주석은 최소화(조건부 렌더링 조건 설명 정도만).

## 코드 리뷰

- 모든 PR은 최소 1명 승인 후 머지, 머지는 승인자가 한다.
- 리뷰 포인트: 컴포넌트 분리 여부, 네이밍 규칙, 주석 규칙, (랜딩) 디자인 원본과의 차이.
