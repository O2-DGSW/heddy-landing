# 0001. FSD + Next App Router 배치

- 상태: 채택 · 2026-09-26

## 결정

- Next 라우팅 폴더는 루트 `app/`, FSD 레이어는 `src/` (`app`, `pages`, `widgets`, `features`, `entities`, `shared`).
- 루트에 빈 `pages/`(README만)를 둬서 `src/pages`가 Pages Router로 인식되지 않게 한다. (Next: 루트에 `app`/`pages`가 있으면 `src/app`/`src/pages`는 무시)
- 루트 `app/*`는 `src/pages/*`를 re-export만 한다.
- 구조 검사는 `steiger`(`pnpm fsd`). 랜딩 한 페이지라 `insignificant-slice` 규칙은 끔.

## 근거

FSD 공식 Next.js 가이드 방식. 섹션이 자주 바뀌는 랜딩에서 섹션 = 슬라이스로 두면 추가·삭제가 파일 폴더 하나로 끝난다.
