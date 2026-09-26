@AGENTS.md

# heddy-landing

헤디 고객용 앱(O2-DGSW/heddy-app)을 소개하는 스크롤 스토리텔링 랜딩. Next.js App Router + FSD.
디자인 원본 `docs/design/` · 팀 코드 컨벤션 `docs/conventions.md` · 계획서 `docs/plans/` · 커밋·PR·이슈는 `commit-pr` 스킬.

## 제품 사실 (카피·화면에서 틀리면 안 됨)

- 고객용 앱이다. 원장용 기능(매출 대시보드, 직원·권한 관리)은 범위 밖이라 언급하지 않는다.
- AI 사진 분석은 시각적 지표(색 균일도, 볼륨 균형, 형태, 거칠기)다. "진단", "치료", 의학적 표현을 쓰지 않는다.
- AR은 정면 카메라 기준 2D/2.5D 합성이다. 실사급 3D처럼 과장하지 않는다.
- 추천은 기록 기반 규칙 점수 방식. 공유 범위는 고객이 직접 고르고, 비공개 저장·삭제가 된다.
- 카피는 창작하지 않는다. 없는 문구가 필요하면 물어본다.

## 이 저장소의 함정

- 라우팅은 **루트 `app/`**에만 있다(얇은 re-export). `src/app`은 FSD app 레이어이고 라우트가 아니다. 루트 `pages/`는 `src/pages`가 Pages Router로 잡히지 않게 막는 스텁이라 지우면 안 된다.
- 폰 두 대는 모든 섹션 위에 떠 있는 **하나의 fixed 레이어**(`widgets/phone-stage`)다. 섹션 위젯은 폰을 그리지 않고, 폰 자세·화면 전환은 섹션 경계를 가로질러 계산된다.
- 스크롤 모션은 `useSceneFrame`에서 ref로 style만 쓴다. 프레임마다 setState 하면 전체가 리렌더된다. 계산은 `model/`의 순수 함수로 분리하고 테스트한다.
- 모션 수치는 `shared/config/motion.ts`, 카피는 `shared/config/copy.ts`, 섹션 순서·높이는 `shared/config/sections.ts` — 각각 거기에만 있다. `SECTION_KEYS` 순서와 `LandingPage`의 렌더 순서는 항상 같아야 한다.
- `*.test.ts`는 디자인 모션의 실행 가능한 명세다. 디자인이 바뀌면 테스트를 먼저 고치고 구현을 맞춘다. 테스트를 구현에 맞춰 느슨하게 고치지 않는다.
- 로고는 PNG만 쓰고, 어두운 배경 위에는 올리지 않는다(ar 섹션 다크 패널 구간은 헤더 로고를 숨김).
- 작업 전에 `docs/plans/`에서 관련 계획을 찾아 읽고, 끝나면 체크리스트를 갱신한다.

## 팀 규칙 중 자주 틀리는 것 (전체: `docs/conventions.md`)

- Props는 `interface`, API 응답·그 외 타입은 `type`.
- Boolean은 `is/has/can/should` 접두어, 내부 핸들러 `handleX`, 콜백 prop `onX`, 상수 `SNAKE_CASE`, 폴더 kebab-case, 컴포넌트 파일 PascalCase.
- 정적 스타일이 3개 이상이면 인라인 금지 → Tailwind 클래스/토큰. 스크롤 프레임마다 ref로 쓰는 transform·opacity는 예외.
- import 순서: React → 외부 라이브러리 → `@/` alias → 상대경로 → style → assets.
- 커밋 메시지는 `type: subject` 형식만 CI를 통과한다(훅이 미리 검사). Claude는 PR을 머지하지 않는다.
