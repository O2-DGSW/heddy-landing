---
name: scroll-motion
description: 섹션 스크롤 모션을 새로 만들거나 고칠 때 사용 (핀 고정, 폰 이동, 화면 전환, 카드·막대·선 애니메이션, 디자인 원본과 모션 맞추기).
---

# 스크롤 모션 구현 절차

엔진: `shared/lib/scroll` — 스크롤 1프레임마다 `SceneFrame`(scrollY, layout, sections, progress(key), isReducedMotion)을 구독자에게 뿌린다. GSAP은 쓰지 않는다(`docs/decisions/0002`).

1. **수치 먼저** — 새 타이밍/거리 값은 `shared/config/motion.ts`의 `TIMELINE.<섹션>`에 `Range`로 추가한다. 디자인 원본(`docs/design/reference/`)에 값이 있으면 그대로 옮긴다.
2. **순수 함수** — `widgets/<슬라이스>/model/<이름>.ts`에 `(frame: SceneFrame) => 결과값` 함수를 만든다. DOM 접근 금지. 도구: `progressIn`, `easeInOutCubic`, `lerp`, `mixRgb` (`shared/lib/motion`).
3. **테스트로 명세** — 같은 폴더 `<이름>.test.ts`. 구간 시작·끝·중간의 핵심 상태를 단언한다. 프레임 만드는 법은 `widgets/phone-stage/model/scene.test.ts` 상단 헬퍼를 따른다.
4. **UI 연결** — 컴포넌트는 `"use client"`, `useSceneFrame(f => { const v = compute(f); el.style.transform = ... })`. setState 금지. 요소는 ref로 잡는다. 프레임마다 바뀌지 않는 정적 스타일은 Tailwind 클래스로(인라인 3개 이상 금지 — `docs/conventions.md`).
5. **reduced motion** — `frame.isReducedMotion`이면 최종 상태로 바로 두거나 opacity만 쓴다.
6. **확인** — `pnpm test`, 그리고 `pnpm dev` 켠 상태에서 `pnpm snap --only=<섹션>`으로 스크린샷을 보고 디자인 원본과 비교한다.

## 알아둘 것

- 폰 A/B의 위치·회전·화면 전환은 전부 `widgets/phone-stage`가 담당한다. 섹션에서 폰 관련 값이 필요하면 phone-stage의 model 함수를 고친다.
- 폰 화면 위에 겹치는 레이어(기록 포커스 밴드, QR 비행)는 폰과 같은 transform을 써야 어긋나지 않는다 → phone-stage 안에 둔다.
- 섹션 높이를 바꾸면 모든 진행도가 바뀐다. `SECTION_HEIGHT_VH`만 고치고 테스트를 돌린다.
