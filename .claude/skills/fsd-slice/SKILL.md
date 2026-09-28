---
name: fsd-slice
description: 새 섹션·위젯·기능·엔티티를 추가하거나 파일을 어디에 둘지 정할 때 사용 (FSD 레이어/슬라이스/세그먼트 배치, import 규칙).
---

# FSD 배치 규칙 (이 저장소 기준)

| 레이어                      | 여기 있는 것                                                             |
| --------------------------- | ------------------------------------------------------------------------ |
| `src/app`                   | 전역 스타일(tokens/theme), 전역 Provider (`entrypoint/`)                 |
| `src/pages/landing`         | 섹션·스테이지를 순서대로 조립                                            |
| `src/widgets/section-*`     | 섹션 하나 = 슬라이스 하나. 카피 + 섹션 전용 모션                         |
| `src/widgets/phone-stage`   | 폰 두 대 fixed 레이어, 폰 화면들                                         |
| `src/widgets/header`        | 상단바                                                                   |
| `src/features/download-app` | 앱 다운로드 QR 팝오버 (사용자 행동)                                      |
| `src/entities/record`       | 시술 기록 타입·목데이터·행 UI                                            |
| `src/shared`                | config(섹션/모션/카피), lib(motion 수학, scroll 엔진), ui(PhoneFrame 등) |

- import는 위 → 아래 방향만(pages → widgets → features → entities → shared). 같은 레이어 슬라이스끼리 import 금지.
- 슬라이스 밖에서는 `index.ts`(public API)로만 가져온다. `@/widgets/x/ui/...` 같은 깊은 import 금지.
- 세그먼트 이름은 목적으로: `ui`, `model`, `lib`, `config`, `api`. `components`, `hooks`, `utils` 금지.
- 이름 규칙은 팀 컨벤션(`docs/conventions.md`)을 따른다: 슬라이스 폴더 kebab-case, 컴포넌트 파일 PascalCase, model/lib 파일 camelCase, Props는 `interface`.

## 새 섹션 추가

1. `shared/config/sections.ts`의 `SECTION_KEYS`(순서)와 `SECTION_HEIGHT_VH`에 추가
2. `shared/config/copy.ts`에 카피 추가
3. `src/widgets/section-<key>/ui/<Name>Section.tsx` + `index.ts` — 뼈대는 `SectionShell` 사용
4. `pages/landing/ui/LandingPage.tsx`에 같은 순서로 배치
5. 폰 화면이 바뀌면 `phone-stage/model/scene.ts`의 `computeScreens`와 테스트 갱신
6. `pnpm fsd && pnpm test`
