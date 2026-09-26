---
status: 계획
owner: 강민
created: 2026-09-26
---

# 랜딩 v2 구현

## 왜

Claude Design "Heddy Landing v2"를 실제 Next.js 사이트로 옮긴다. 폰 두 대 스테이지와 섹션 뼈대는 셋업 프롬프트(`SETUP_PROMPT.md`) 단계에서 만든다. 이 계획은 그 이후의 섹션별 고유 모션과 화면 디테일.

## 범위

- 포함: 8개 섹션 모션, 폰 화면 8종 디테일, 헤더 다크 처리, 모바일(<1024px) 레이아웃, reduced motion
- 제외: 실제 QR/스토어 링크(출시 후), 분석 도구

## 할 일

- [ ] 로고 PNG 넣기 (`public/brand/`) · 디자인 원본 HTML 넣기 (`docs/design/reference/`)
- [ ] record: 좌측 레일 + "핀 진행 %" + 큰 날짜 색 보간 + 포커스 밴드(12행, 가운데만 선명) — `TIMELINE.record`
- [ ] report: 지표 막대 3개 scaleX 스태거 (섹션 카피 + 폰 화면 둘 다) — `TIMELINE.report`
- [ ] recommend: 기록 3건 → 추천 선 드로잉(strokeDashoffset) — `TIMELINE.recommend`
- [ ] ar: pill 분할 → 다크 패널 → 패널 문구 → 카피 + 폰 재등장 → 스타일 3단 전환, 헤더 로고 숨김 — `TIMELINE.ar`
- [ ] share: QR clip-path 생성 → 미용실 폰 슬라이드 인 → QR 포물선 비행 → 웹뷰 — `TIMELINE.share`
- [ ] 폰 화면 8종을 디자인 원본 레이아웃대로 다듬기
- [ ] 모바일: 카피 상단 14vh, 폰 하단(cy 70%), ar 분할은 세로
- [ ] reduced motion 처리

## 완료 기준

- [ ] 섹션마다 `model/*.test.ts` 명세 테스트 존재 · 통과
- [ ] `pnpm snap` / `pnpm snap --mobile` 결과를 `design-parity-reviewer`가 대조해서 "깨짐" 0건
- [ ] `pnpm verify` · `pnpm build` 통과

## 변경 기록

- 2026-09-26: 하네스 세팅과 함께 생성.
