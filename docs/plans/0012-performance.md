---
status: 완료 # 계획 | 진행 | 완료 | 보류
owner: jang-gangmin
created: 2026-10-14
---

# 랜딩 퍼포먼스 95점 이상

## 왜

Lighthouse 퍼포먼스 84점(데스크톱)을 95점 이상으로 올린다. 이슈 #46.

기준선(프로덕션 빌드, localhost):

| | 점수 | FCP | LCP | TBT | SI |
|---|---|---|---|---|---|
| 데스크톱 | 85 | 0.5s | 0.9s | 210ms | 2.9s |
| 모바일 | 34 | 1.6s | 11.2s | 10,020ms | 16.9s |

원인:

- 히어로 3D 폰이 Spline 런타임과 씬(0.7MB) 로드 뒤 약 3초가 지나서야 보였다(Speed Index).
- Spline 실행이 긴 작업(데스크톱 263ms·221ms)을 만들었다(TBT).
- 외부 글꼴 CSS가 렌더링을 막았다(모바일 812ms).
- 화면 밖 폰 화면 이미지 약 25장이 첫 화면 이미지와 대역폭을 나눴다.

## 결정

- **히어로 포스터**
  - 히어로 3D 첫 화면을 캔버스 그대로 렌더한 투명 이미지(`public/screens/hero/poster.webp`)를 서버 HTML에서 바로 보여 준다.
  - 자리는 `computeStageLayout`·`computeSplineViewport` 식을 CSS `min()`·vw·vh로 옮긴 `heroPosterCss`가 정한다. JS 전 첫 페인트부터 캔버스와 같은 자리다.
  - 3D 캔버스가 다 나타나면(페이드 500ms 뒤) 포스터를 치운다. 같은 그림이라 바뀌는 게 보이지 않는다(데스크톱 픽셀 차 0.26%).
- **첫 상호작용 때 시작**(`useFirstInteraction`)
  - 대상: Spline 실행, 화면 밖 폰 화면·오버레이 이미지.
  - 상호작용: 마우스 이동·클릭·휠·터치·키·스크롤. 새로고침으로 스크롤이 복원되면 바로 시작한다.
  - 시작 전 히어로 자세(스크롤 900px 미만)는 포스터, 그 밖은 CSS 폰이 맡는다.
  - 씬 파일은 미리 받지 않는다(preconnect만).
- **글꼴**
  - Pretendard를 가변 글꼴 dynamic subset(압축 13.5KB CSS, 쓰인 글자 범위만 받음)으로 바꾼다.
  - `media="print"` → 로드 뒤 `all`로 렌더링을 막지 않게 한다(그 전엔 시스템 글꼴, swap).

## 할 일

- [x] 기준선 측정
- [x] `heroPosterCss` 명세 테스트(뷰포트 7개에서 캔버스 자리와 일치)와 `HeroPoster`
- [x] `useFirstInteraction`, Spline·화면 밖 이미지 지연
- [x] 글꼴 dynamic subset·비차단 로드
- [x] 재측정, 포스터 ↔ 3D 비교, 스크롤 흐름 확인, `pnpm verify`

## 결과 (프로덕션 빌드, localhost, 이미지 캐시가 찬 상태로 3회)

| | 점수 | FCP | LCP | TBT | SI |
|---|---|---|---|---|---|
| 데스크톱 | 100 · 100 · 100 | 0.2s | 0.5s | 0ms | 0.2~0.3s |
| 모바일 | 98 · 100 · 98 | 0.8s | 1.6~2.3s | 0~20ms | 0.9s |

## 남은 것

- 배포 사이트(heddy.site)에서 PageSpeed로 다시 잰다. CDN·네트워크 차이로 값이 다를 수 있다.
- 포스터는 히어로 3D 렌더를 찍은 이미지라, Spline 히어로 모습을 바꾸면 다시 찍어야 한다.
  - 캡처 방법: 프로덕션 빌드를 headless Chrome으로 열고 `app.render()` 직후 `canvas.toDataURL()`, 폰·그림자만 잘라냄.
  - 잘라낸 비율은 `PHONE_3D.poster`에 넣는다.

## 변경 기록

- 2026-10-14: 작성·구현·측정.
