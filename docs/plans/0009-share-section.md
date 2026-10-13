---
status: 진행 # 계획 | 진행 | 완료 | 보류
owner: jang-gangmin
created: 2026-10-13
---

# 시술기록 공유 섹션: 3D 폰 두 대와 QR 전달

## 왜

레퍼런스 영상 두 개를 따라 share 섹션을 구성한다. 이슈 #36.

- 영상 1(2026-10-13 10:25, 모션 기준)
  1. 기록 공유 화면에서 토글을 하나씩 켠다.
  2. 화면이 내려가 "공유 링크 생성"을 누르면 QR 모달이 뜬다.
  3. QR이 미용실 폰의 스캔 화면으로 날아간다.
  4. "공유된 시술기록"이 열리고 체크 표시가 뜬다.
- 영상 2(2026-10-13 10:31, 폰 위치 기준)
  - 카피는 왼쪽에 둔다.
  - 공유하는 폰 A는 왼쪽(cx − 0.13W)으로 비켜선다.
  - 받는 폰 B는 오른쪽에서 기울어진 채 들어와 cx + 0.13W에 선다.

## 범위

- 포함
  - 폰 두 대 모두 Spline 3D다(사용자 선택).
    - Spline 씬에 PhoneB를 감싼 `ShareRigB`를 추가했다.
    - A는 `RecordRig`를, B는 `ShareRigB`를 런타임에서 옮긴다.
  - 화면은 피그마 landing 프레임 3개를 HTML로 옮긴다.
    - S4-공유화면(964:2296)
    - S4-공유QR화면(964:2416)
    - S3-시술기록 공유(980:2940)
  - 스캔 화면은 피그마에 없어서 영상대로 그린다(초록 모서리 + 스캔 선).
  - 3D 폰은 페이지 끝까지 유지한다. CSS 폰은 Spline 실패·모션 줄이기 때만 쓴다.
- 제외
  - 영상 1의 좌측 카피("02 / 04 시술기록 공유", "씬 4 · 공유 (카피 미정)")는 쓰지 않는다. 지금 카피("미용실에서 설명 없이")를 유지한다.

## 결정

- share 순서는 레퍼런스 영상 1을 따른다. A가 공유 링크를 만든 뒤 B가 들어온다.
  - 원본 명세의 shareXShift [0.1, 0.32]를 [0.38, 0.52]로 미뤘다.
  - QR 비행은 [0.56, 0.70], 스캔 → 공유된 시술기록은 [0.71, 0.75]로 옮겼다.
- share 고정이 끝나면 B는 오른쪽으로 빠지고 A는 가운데로 돌아온다.
  - 원본은 share.end ~ closing.top이라 길이가 0이었다. 이걸 share 고정 끝 ~ share.end로 바꿨다.
- 화면 오버레이 투영은 원근 안쪽에서 옮긴다: `translate3d(sceneX, sceneY, 0) rotateZ`.
  - 가운데에서 비켜선 폰도 3D와 겹치게 하려는 것이다.

## 할 일

- [x] 피그마 에셋(`public/screens/share/`)
- [x] Spline 씬 `ShareRigB` 추가
- [ ] 사용자 Spline export
- [x] `TIMELINE.share`, `SHARE_SCREEN` 수치와 명세 테스트(`shareScene`, `scene`, `scene3d`)
- [x] `ShareScreen`(토글 → QR 모달), `ScanScreen`, `SharedRecordScreen`
- [x] 폰 A/B 3D 배치(`computeShareRigs`), B 화면 오버레이, QR 비행
- [ ] export 후 폰 B 본체 위치·기울기 브라우저 확인

## 완료 기준 (돌려서 확인할 수 있게)

- [x] `pnpm test -- shareScene`, `pnpm test -- scene3d` 통과
- [ ] 브라우저에서 다음을 확인한다.
  - 토글이 차례로 켜진다.
  - 공유 링크 생성을 누르면 QR 모달이 뜬다.
  - B가 들어온다.
  - QR이 날아간다.
  - 공유된 시술기록과 체크가 보인다.
- [x] `pnpm verify` 통과

## 변경 기록

- 2026-10-13: 작성·구현. 폰 A 흐름과 QR 비행은 Chrome에서 확인했다. 폰 B 본체는 Spline export 대기 중이다.
