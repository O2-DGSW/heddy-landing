---
status: 진행
owner: 강민
created: 2026-09-30
---

# record 섹션 — 3D 폰에 시술기록이 하나씩 튀어나오며 쌓이는 모션

## 왜

record("01 — 시술기록 저장")에서 기록이 시간순으로 쌓이는 느낌을 3D로 보여 준다. 폰이 한 바퀴 돌며 홈 → 시술기록 화면으로 바뀌고, 이미지 2 각도(오른쪽 옆면이 보이게)로 기울어진다. 이 상태에서 스크롤하면 기록 12건(`MOCK_RECORDS`)이 오래된 순으로 하나씩 **리스트 맨 위에 추가되며 화면 밖으로 튀어나온다**(토스 앱 소개 영상 방식). 좌측 큰 날짜도 같은 스텝으로 굴러 바뀐다.
spec §5의 "12행 포커스 밴드"(CSS 오버레이)는 이 3D 스택으로 대체한다.

## 설계

- **Spline에는 모델·재질만 둔다.** record 구간의 폰 회전과 카드 위치는 `SplineStage`가 `useSceneFrame`에서 런타임 API(`findObjectByName` → position/rotation/scale/visible)로 쓴다. Spline Scroll 이벤트는 페이지 px 고정이라 페이지 깊은 곳(record)에서는 뷰포트마다 ~1000px씩 어긋나고, 좌측 날짜(DOM)와 따로 놀기 때문이다. 히어로 합체(Scroll 이벤트)는 그대로다.
- 씬 구조: `RecordRig`(원점, 코드가 회전) ⊃ `PhoneA`(Scroll 이벤트가 로컬 transform을 움직임) ⊃ `RecordLayer`(화면 평면, 씬 단위 = px, 기본 숨김) ⊃ `RecordBase`, `Card01~12`, `Veil`. 홈 화면 메시는 `ScreenA`.
- 스텝 계산은 `entities/record/lib/recordSteps.ts` 한 곳에 둔다. 폰(`widgets/phone-stage/model/recordStack.ts`)과 좌측(`widgets/section-record/model/recordAside.ts`)이 같은 값을 쓴다.
- 3D → CSS 폰 넘기기는 archive 끝에서 **record 끝**으로 옮겼다. record 끝에서 리그가 정면으로 돌아오므로 이음새가 없다.

## 할 일

- [x] 모션 명세 테스트: `recordSteps.test.ts`, `recordStack.test.ts`, `recordAside.test.ts`, `scene3d.test.ts`(넘기기)
- [x] 순수 함수 구현 + `TIMELINE.record`·`RECORD_STACK` 설정
- [x] Spline: 옛 record 스핀 State/이벤트 제거, `RecordRig`·`RecordLayer`·자리표시 카드·`Veil` 추가, 홈 화면 메시 이름 `ScreenA`
- [x] `SplineStage`에서 런타임 API로 연결, 넘기기 시점 이동
- [x] 좌측 레일·큰 날짜(굴러 바뀜)·캡션
- [ ] 사용자: 카드 이미지 12장 + 빈 기록 화면 1장 전달 → 재질에 적용(홈 화면 텍스처 `ScreenMatA`도 다시 올려야 함)
- [ ] 사용자: Spline "Update Code Export"
- [ ] 이미지 비율에 맞춰 `RECORD_STACK`(listTop·card·slotGap·navTop)과 `tiltPose` 튜닝
- [ ] CSS `RecordScreen`을 같은 이미지(빈 화면 + 최신 순 카드)로 교체
- [ ] `Veil` 불투명도를 런타임에서 바꿀 수 있는지 확인(지금은 visible만 토글)

## 완료 기준

- [x] `pnpm verify` 통과
- [ ] `pnpm dev` 1440×900·1024×700에서 스핀 → 기울기 → 카드 12장 튀어나옴 → 정면 복귀 → CSS 폰 → 리포트, 역스크롤까지 확인
- [ ] reduced motion에서 CSS 폰 + 최종 날짜

## 모션 명세

- 설정: `TIMELINE.record`(band, spinVh, stepEnter, settle), `RECORD_STACK`
- 명세 테스트: `entities/record/lib/recordSteps.test.ts`, `widgets/phone-stage/model/recordStack.test.ts`, `widgets/section-record/model/recordAside.test.ts`

## 변경 기록

- 2026-09-30: 계획·명세·코드 연결. Spline 씬 구조 변경(export 전).
