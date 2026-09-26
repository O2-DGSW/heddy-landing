---
name: commit-pr
description: O2 팀의 커밋 메시지 형식, 브랜치 네이밍, PR 생성 절차를 지킬 때 쓴다. 사용자가 "커밋해줘", "커밋 해", "PR 만들어줘", "PR 올려줘", "머지하자", "이슈 만들어줘" 라고 말하거나, 작업을 마치고 저장소에 기록을 남기려는 모든 순간에 이 스킬을 확인한다. 사용자가 형식을 명시하지 않아도 항상 이 규칙을 따른다 — 이 규칙을 어기면 CI에서 막혀 main/master 머지가 불가능하다.
---

# 커밋 & PR

O2 팀 전체에 적용되는 필수 규칙. 아래 순서대로 진행한다.

## 1. 커밋하기 전에 — 반드시 기능별로 쪼갠다

먼저 `pnpm verify`(typecheck · lint · test · fsd)가 통과하는지 확인한다. 실패하면 커밋하지 않고 고친다.

**여러 기능/파일을 한 번에 작업했어도 절대 한 커밋으로 몰아서 올리지 않는다.** `git status`, `git diff`로 변경 사항을 먼저 훑고, 서로 다른 기능·목적의 변경은 각각 별도 커밋으로 나눈다.

쪼개는 기준:

- **기능 단위**: "A 기능 포팅" + "A를 라우팅에 연결"처럼 하나의 커밋이 하나의 논리적 작업만 대표해야 한다. 설정 변경(alias, config), 새 기능 코드, 그 기능을 앱에 연결하는 배선(wiring)은 성격이 다르면 나눈다.
- **되돌림 안전성**: "이 커밋만 되돌려도 프로그램이 정상 동작하는가"를 기준으로 삼는다. 한 커밋만 revert했을 때 다른 기능이 같이 깨지면 잘못 쪼갠 것이다.
- 서로 다른 파일이라도 같은 기능을 완성하기 위한 변경이면(예: 컴포넌트 + 그 타입 정의) 하나로 묶어도 된다 — 무조건 파일 단위로 잘게 쪼개라는 뜻은 아니다.

`fix`류는 이 기준에서 예외로, 발견 즉시 커밋해도 된다. 기능이 다 끝난 뒤 모아뒀다가 한 번에 커밋하는 방식은 피한다.

## 2. 커밋 메시지 형식

`type: subject` 형식을 쓴다. type은 아래 표에 있는 것만 쓸 수 있다 — 없는 type을 새로 만들지 않는다.

| type        | 언제 쓰는가                                                           |
| ----------- | --------------------------------------------------------------------- |
| `feat:`     | 새 기능 추가                                                          |
| `fix:`      | 버그 수정                                                             |
| `docs:`     | 문서 수정                                                             |
| `style:`    | 코드 포맷팅 수정 (prettier/eslint 등 — UI 스타일 변경은 `feat`/`fix`) |
| `refactor:` | 리팩토링                                                              |
| `chore:`    | 빌드/설정 변경 (코드 로직 변경 없음)                                  |
| `perf:`     | 성능 개선                                                             |
| `ci:`       | CI/CD 설정                                                            |
| `revert:`   | 커밋 되돌림                                                           |
| `merge:`    | 브랜치 병합                                                           |
| `hotfix:`   | 긴급 버그 수정                                                        |

subject는:

- 한국어/영어 모두 가능, 띄어쓰기 가능
- 문장식이 아닌 개조식 ("~을 구현" O, "~을 구현했습니다" X)
- 마침표·쉼표 없음
- 50자 이내

좋은 예: `feat: 로그인 페이지 UI 구현` / 나쁜 예: `추가`, `feat: 기능 추가`, `fix: bug fixed.`

`.claude/hooks/check-commit-msg.mjs`가 `git commit` 실행 전에 첫 줄을 검사해서 형식이 틀리면 막는다.

이 저장소에서 type 고르기 (`test`·`motion` 같은 type은 없다):

- 새 섹션 모션·화면 구현 → `feat:` (명세 테스트도 같은 커밋에 포함)
- 디자인 원본과 어긋난 모션·수치 수정 → `fix:`
- 구조만 바꾸고 동작은 같음(슬라이스 이동 등) → `refactor:`
- prettier/eslint만 → `style:` · 의존성·설정·하네스(.claude, 스크립트) → `chore:` · docs/plans·decisions → `docs:`

## 3. 브랜치

prefix는 커밋 type과 맞춘다: `feature/#이슈번호-설명`, `fix/#이슈번호-설명`, `refactor/#이슈번호-설명`, `style/#이슈번호-설명`. 여러 화면이 합쳐져 하나의 기능이 되면(예: 회원가입) 브랜치를 나누지 않고 하나로 묶는다.

새 브랜치를 만들어야 하는데 관련 이슈 번호를 모르면, 진행하기 전에 사용자에게 물어본다.

## 4. PR 만들기

1. **제목**: `feat: feat-name/#00` 형식 (커밋의 `merge:` 규칙과 동일한 스타일). 브랜치 이름의 설명 부분과 이슈 번호를 그대로 가져오면 된다.
2. **본문**: `assets/pr_body_template.md`(= `.github/pull_request_template.md`)의 구조를 그대로 채운다. 팀 코드 리뷰 규칙의 필수 항목은 이렇게 넣는다:
   - **관련 이슈**: `Resolves #번호`
   - **변경 내용**: 구현한 컴포넌트 / 구현한 함수 / 더미데이터 사용 여부(`MOCK_RECORDS` 등)를 각각 소제목 없이 목록으로
   - **작업 목적**: 관련 계획서가 있으면 `docs/plans/NNNN` 링크
   - **스크린샷**: 구현한 뷰. `pnpm dev` + `pnpm snap --only=<섹션>`으로 `.snapshots/`에 찍어두고, 파일은 직접 첨부할 수 없으니 "스크린샷 첨부 필요: .snapshots/desktop/<파일>"로 자리만 표시하고 사용자에게 알린다. UI 변경이 없으면 섹션 삭제.
   - **테스트 방법**: 실제로 돌린 것만 체크(`pnpm verify`, 추가한 명세 테스트 이름, 수동 스크롤 확인)
   - **기타 사항**: reduced motion·모바일 처리, 디자인 원본과 의도적으로 다른 점
3. **머지 커밋 메시지**: GitHub가 기본으로 채우는 `Merge branch 'main' into ...` 같은 텍스트는 지우고 `merge: feat/feat-name/#00`으로 바꾼다.
4. PR은 최소 1명 이상 승인 후 머지되고, 머지는 승인자가 수행한다 — Claude가 직접 머지 버튼을 누르지 않는다.

## 5. 이슈 만들기 (해당하면)

GitHub Issues를 `gh` CLI로 쓴다(`gh issue create --label ...`). 제목은 50자 이내, 마침표 없이, type을 제목에 함께 표기. 본문은 `~합니다/~입니다` 체로, 이슈 템플릿이 있으면 항목을 다 채운다.

**이슈 템플릿은 `.github/ISSUE_TEMPLATE/`에 4종이 있다** — `gh issue create`로 만들 때도 해당 템플릿의 항목 구성을 그대로 따른다:

- `bug_report.yml`(버그 리포트, 제목 `[Bug] `, 자동 라벨 `type: bug`)
- `feature_request.yml`(기능 제안, 제목 `[Feature] `, 자동 라벨 `type: feature`)
- `refactor.yml`(Refactor, 제목 `[Refactor] `, 자동 라벨 `type: refactor`)
- `task.yml`(작업 — refactor/chore/docs/test/enhancement 외 자잘한 작업, 제목 `[Task] `, 자동 라벨 없음 — 본문 드롭다운으로 유형만 고르고, 아래 라벨 규칙에 맞는 `type: ` 라벨은 직접 붙인다)

라벨 3종은 필수 — 하나라도 빠지면 안 된다. 실제 라벨 문자열은 `type: `/`priority: `/`size: ` 접두어를 붙인다(이슈 템플릿의 자동 라벨과 통일):

- **type**: `type: feature` / `type: bug` / `type: refactor` / `type: docs` / `type: chore` / `type: enhancement` / `type: test` / `type: hotfix` (초기 설정은 `type: init-project`/`type: init-structure`/`type: init-docs`)
- **priority**: `priority: critical` / `priority: high` / `priority: medium` / `priority: low`
- **size**: `size: XS`(4시간 이내) / `size: S`(1~2일) / `size: M`(3~5일) / `size: L`(1~2주) / `size: XL`(2주 이상)

개발 도중 생기는 자잘한 컴포넌트화·로직 수정·디자인 수정은 새 이슈를 만들지 않고 커밋 메시지로만 남긴다. 필수 개발이 끝난 뒤 추가로 발생한 것만 새 이슈로 만든다.

## FAQ

- 여러 파일을 수정했는데 성격(type)이 다르면 → 부분 스테이징으로 커밋을 분리한다. `git add -p`는 대화형이라 Claude는 쓰지 못하므로, 파일 단위로 `git add <파일>` 하거나 한 파일 안의 일부만 필요하면 `git diff <파일> > /tmp/p.patch`에서 해당 hunk만 남겨 `git apply --cached /tmp/p.patch`로 스테이징한다.
- type이 애매하면 → 가장 주요한 변경사항 기준으로 판단한다.
- 이미 잘못 쓴 커밋을 고치고 싶으면 → push 전이면 `git commit --amend`, push 후면 새 커밋으로 정정한다 (기존 커밋을 되돌리는 방식이 원칙에 더 가깝다).
