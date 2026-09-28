# 디자인 원본

- Claude Design 프로젝트: [Heddy Landing Page Build](https://claude.ai/design/p/7ee15dd9-6c31-4f17-a303-eb6fed1acfb4?file=Heddy+Landing+v2.dc.html)
  - `Heddy Landing v2.dc.html` — 현재 기준
  - 디자인 시스템: heddy Design System (토큰은 `src/app/styles/tokens.css`로 옮김)
- 원본에서 추출한 수치·카피: `spec.md` (구현 후엔 `src/shared/config/*.ts`와 테스트가 기준)
- 원본 섹션 키 ↔ 코드 섹션 키: `src/shared/config/sections.ts` 주석
- 원본 트윅: `scrollLength`(섹션 길이 배율, 기본 1), `heroTilt`(히어로 V자 각도, 기본 12°)

## reference/

Claude Design에서 내보낸 파일을 그대로 넣는 곳 (읽기 전용 — 훅이 수정을 막음).
넣을 것: `Heddy Landing v2.dc.html`, `support.js`, 디자인 시스템 `assets/`.
