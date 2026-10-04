---
status: 진행
owner: 강민
created: 2026-10-01
---

# 폰 화면 안 스크롤 — 긴 상세 화면이 스크롤에 따라 내려간다

## 왜

리포트 구간("12번의 기록이, 나를 설명합니다")에서 폰은 정면으로 고정돼 있고, 스크롤에 따라 폰 안 화면만 바뀐다. 여기에 "다운펌 분석완료" 상세 화면(세로로 긴 한 장)을 넣고, 페이지를 스크롤하면 **화면 내용이 폰 안에서 같이 올라가게** 한다. 상태바·앱바(뒤로/제목/탭)와 하단 탭바는 실제 앱처럼 고정한다.

## 결정 (2026-10-04)

- **위치**: 리포트 섹션의 폰 화면(`report`)을 상세 화면으로 교체.
- **고정 영역**: 상태바 + 앱바 + 하단 탭바. 본문(사진 ~ 수정/공유/삭제)만 스크롤.
- **스크롤 구간**: report 진행도 10%~90%(`TIMELINE.report.detailScroll`), 선형.
- **구현 방식: B(CSS 폰)**. 이 구간은 record가 끝나면서 이미 Spline → CSS 폰으로 넘어간 정면 구간이라, Spline 실험(A) 없이 `overflow: hidden` + translateY로 구현한다. 글자도 선명하다.
- **기록 → 상세 화면 전환 시점**: 공통 밴드(섹션 end 이후 35~65%)를 쓰면 리포트 섹션 전반부에 기록 화면이 남아 본문 스크롤과 겹친다. 그래서 이 전환만 record end 기준 −45%~−15%로 앞당겼다(`TIMELINE.report.fromRecordBand`). 리포트 섹션이 붙을 때 이미 상세 화면이 다 보인다.

## 변경 (2026-10-04): CSS 폰 → Spline 폰

사용자 요청으로 리포트 구간도 Spline 3D 폰을 쓴다. 3D 캔버스를 report 섹션 끝까지 유지하고(`computeSplineHandoff`), 같은 상세 화면 HTML을 폰 화면 위에 CSS 3D로 투영해 겹친다(`computeScreenOverlay`, `PHONE_3D.screen`).

- 투영: `translate(캔버스 중심) scale(S) perspective(1700) rotateX(8°) translateZ(18)` — 씬 카메라(정면, 거리 1700)와 같은 식이라 네 모서리가 1px 안으로 맞는다(테스트).
- 화면 268×583, 모서리 반경 36/57(스쿼클 근사). 텍스트가 HTML이라 선명하고 본문 스크롤·지표 막대도 그대로 쓴다.
- 기록 → 상세 전환은 "카드를 눌러 들어가는" 느낌으로(`computeTapToDetail`, `TIMELINE.report.tapBand`·`pushBand`):
  1. 탭: 리스트 맨 위 카드(최신 2026.09 다운펌 = 상세 화면의 기록)가 살짝 눌렸다 돌아오고(3D 카드 scale), 카드 안에 하이라이트·물결.
  2. push: 상세 화면이 오른쪽에서 밀려 들어오고 뒤 리스트는 살짝 어두워진다. 상태바·하단 탭바는 두 화면이 같아 고정.
  - CSS 폰(Spline 실패·reduced motion)은 기존 크로스페이드 그대로.
- report 끝에서 CSS 폰으로 넘어갈 때 두 폰의 화면 크기(280 vs 268)가 달라 140px 동안 겹쳐 보인다. recommend 이후도 Spline으로 옮기면 사라진다.

## 이미지

원본 713×2000(모서리 투명)을 3장으로 잘라 투명 모서리는 배경색으로 채웠다(`public/screens/detail/`).

| 조각       | 범위(px)                                      | 스크롤 |
| ---------- | --------------------------------------------- | ------ |
| top.png    | 0~263 (상태바 + 뒤로/제목 + 정보/분석완료 탭) | 고정   |
| body.png   | 263~1800 (사진, 신뢰도, 지표, 수정/공유/삭제) | 스크롤 |
| bottom.png | 1800~2000 (탭바 + 홈 인디케이터)              | 고정   |

화면 폭(280)에 맞추면 본문이 올라갈 수 있는 거리는 약 190px(이미지 기준 약 485px)이다. 더 길게 보여 주려면 더 긴 캡처가 필요하다.

## 할 일

- [x] 이미지 3장 자르기
- [x] `DETAIL_SCREEN` 치수, `TIMELINE.report.detailScroll`·`fromRecordBand`
- [x] `widgets/phone-stage/model/detailScroll.ts` + 명세 테스트(구간 전 0 · 끝에서 정지 · 단조 증가 · 끝에서 본문 바닥 = 탭바 위 · reduced motion 0)
- [x] `DetailScreen`(screens.tsx) — 상단·하단 고정 이미지 + 본문만 ref로 translateY
- [x] 기록 → 상세 전환 시점 테스트(`scene.test.ts`)
- [x] 크롬 확인: 리포트 0% / 50% / 95% — 상태바·탭바 고정, 본문만 이동, 끝에서 수정/공유/삭제가 탭바 바로 위

## 완료 기준

- [x] `pnpm verify` 통과
- [x] `pnpm build` 통과
- [ ] reduced motion 확인

## 변경 기록

- 2026-10-01: 생성(Spline A / CSS B 두 갈래 계획).
- 2026-10-04: 위치·고정 영역·구간 결정, B로 구현.
