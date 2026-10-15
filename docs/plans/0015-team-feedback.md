---
status: 완료
owner: 장강민
created: 2026-10-14
---

# 팀 피드백 반영 랜딩 다듬기 (이슈 #53)

## 왜

팀 리뷰(디스코드, 2026-10-14)에서 목업이 작고 테두리가 어긋나 보이며, 스크롤이 계속 흘러가 섹션이 끊어 읽히지 않는다는 의견이 나왔다. AR 머리 전환 중간 장면, 마지막 섹션 폰 잘림, 문구 표기도 함께 고친다.

## 범위

- 포함: 데스크톱 폰 크기·여백, 공유 목업 테두리, 휠 스크롤 멈춤 지점, AR 박스 속도·스타일 전환, closing 폰 잘림·버튼 크기, 문구(히어로 본문·헤디→Heddy·리포트 제목)·문의 메일
- 제외: 모바일 쌓기 구성(`0014`)의 배치 — 문구·버튼 크기만 같이 바뀐다

## 할 일

- [x] 문구: 히어로 본문 "개인 헤어 시술기록 기반 AI 맞춤형 스타일 추천 서비스", 아카이브·closing·다운로드 안내의 "헤디" → "Heddy", 리포트 제목 "12번의 기록이, / 한눈에 보는 지표로"(지표는 앱에 구현된 사진 분석 상태 지표)
- [x] 문의 메일 `heddy@heddy.site`
- [x] 폰 크기: `STAGE_LAYOUT.desktop` scaleCap 0.8 → 1, scaleHeightRatio 0.5 → 0.62(1440×900에서 폰 높이 450 → 558px)
- [x] 여백: 헤더·섹션 카피·푸터가 같은 좌우 여백 `px-gutter`(max(4rem, 9vw))에 선다. 폰 가로 중심 0.65W → 0.68W
- [x] 공유 목업 테두리: 화면 오버레이 둘레에 베젤색 링(2px) — 3D 화면(스쿼클)과 오버레이(타원 모서리)의 곡선 차이로 비치던 바탕을 덮는다
- [x] AR 박스: `TIMELINE.ar.pillMorph` [0.02, 0.14] → [0.02, 0.08], 패널 문구도 앞당김
- [x] AR 스타일 전환: 스크롤이 `styleSteps`(0.67 · 0.85)를 넘으면 전환 한 번을 `styleDurationMs`(900ms) 동안 재생. 이미지 교체 구간을 짧게(R(t, .5~.62))
- [x] 스크롤 멈춤: `SCROLL_STOP` 지점(섹션 시작, AR 패널·카피·스타일 전환)에서 관성 휠 스크롤을 세우고, 350ms 머문 뒤 휠이 180ms 멈췄다 다시 들어오면(또는 뷰포트 0.9만큼 더 굴리면) 푼다
- [x] closing: 푸터가 f px 올라오면 폰 위치·크기를 (H − f)/H배로 줄여 잘리지 않게. 카드형 스토어 버튼 확대(아이콘 32, 스토어명 20px)

## 완료 기준 (돌려서 확인할 수 있게)

- [x] `pnpm test` — `scene.test.ts`(closing 푸터), `arScene.test.ts`(0.08), `arScreen.test.ts`(arStyleTarget · stepStyleClock · computeArStyleAt), `smoothScroll.test.ts`(firstStopCrossed · scrollStopsPx · isStopReleased)
- [x] 1440×900 스크린샷: 히어로·기록·리포트·추천·AR·공유·closing·페이지 끝
- [x] `pnpm verify` 통과

## 모션 명세 (해당 시)

- TIMELINE 키: `ar.pillMorph`, `ar.panelCopyIn`, `ar.styleSteps`, `ar.styleDurationMs`, `ar.styleImage` · `SCROLL_STOP` · `STAGE_LAYOUT.desktop`
- 명세 테스트 파일: 위 완료 기준

## 변경 기록

- 2026-10-14: 작성·구현. 공유 폰 A 아랫변의 옅은 선은 3D 테두리 반사라 그대로 둔다.
- 2026-10-15: 스크롤 멈춤(`SCROLL_STOP`)은 AR에서 여러 번 끊겨 부자연스러워 모두 지웠다(이슈 #60). 관성 스크롤만 남긴다.
