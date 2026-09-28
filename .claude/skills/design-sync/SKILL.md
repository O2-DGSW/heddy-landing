---
name: design-sync
description: Claude Design 원본(Heddy Landing)이 바뀌었거나 구현을 디자인과 대조할 때 사용. "디자인 바뀜", "원본이랑 비교", "디자인대로 맞춰줘".
---

# 디자인 원본 동기화

원본: `docs/design/README.md`의 Claude Design 프로젝트. 내보낸 파일은 `docs/design/reference/`(읽기 전용, 훅이 수정을 막음).

1. 사람에게 최신 버전을 `docs/design/reference/`에 내보내 달라고 요청한다(직접 수정 불가).
2. 원본 HTML의 `update()` 안 숫자를 읽어 `shared/config/motion.ts`와 대조한다. 원본의 data-k 키 ↔ 이 저장소 섹션 키 대응은 `shared/config/sections.ts` 주석에 있다.
3. 달라진 값은 **테스트부터** 고친다(`*.test.ts`) → 구현을 맞춘다.
4. 카피가 바뀌었으면 `shared/config/copy.ts`만 고친다.
5. `pnpm dev` + `pnpm snap`으로 스크린샷을 찍고, 필요하면 `design-parity-reviewer` 에이전트에게 대조를 맡긴다.
6. 결정이 필요한 차이(의도된 변경인지 애매한 것)는 목록으로 사람에게 묻는다.
