---
status: 계획
owner: 강민
created: 2026-09-30
---

# 히어로 3D 폰 합체 — Spline 먼저, 안 되면 React Three Fiber

## 왜

히어로의 두 폰은 3D로 렌더링된 목업이라, CSS로 평면 이미지를 돌리면 두께·옆면·원근이 안 바뀌어서 "합쳐지는" 느낌이 안 난다. 실제 3D 모델을 스크롤로 움직여야 한다.
먼저 **Spline + Claude Code(Spline MCP)**로 시도하고, 아래 "통과 기준"을 하나라도 못 넘으면 **React Three Fiber(R3F)**로 간다.

## 바뀌지 않는 것 (A·B 공통)

- 스크롤 엔진(`shared/lib/scroll`, `useSceneFrame`)과 "순수 함수 + 테스트가 명세" 방식은 그대로. GSAP 안 씀.
- 폰 자세 계산은 렌더러와 분리한다. `widgets/phone-stage/model/`의 순수 함수가 3D 자세를 내고, Spline이든 R3F든 그 값을 **적용만** 한다.
- 폰은 여전히 `widgets/phone-stage` 하나의 fixed 레이어. 섹션 위젯은 폰을 그리지 않는다.
- WebGL이 없거나 `isReducedMotion`이면 지금의 CSS 폰(`PhoneFrame`)을 그대로 보여준다(폴백).

## 0. 공통 준비 — 3D 자세 명세 (먼저)

- [ ] `shared/config/motion.ts`의 `TIMELINE.hero`에 3D 초기 자세 추가 (디자인 캡처를 보고 튜닝할 초기값)
  ```ts
  hero3d: {
    a: { rotX: 8, rotY: 22, rotZ: -14 },   // 왼쪽 앞 폰(홈 화면)
    b: { rotX: 8, rotY: -22, rotZ: 14 },   // 오른쪽 뒤 폰(AR 화면)
    depthOffset: 0.6,                        // B가 A보다 뒤로 들어간 거리(월드 단위)
  },
  ```
- [ ] `model/scene3d.ts` — `computePhones3D(frame) => { a: Pose3D, b: Pose3D }`, `type Pose3D = { x; y; z; rotX; rotY; rotZ; scale; opacity }`. 기존 `computePhones`의 x/y/opacity 흐름을 그대로 쓰고, 회전 3축은 `archive.converge` 구간에서 `hero3d` → 0으로 보간.
- [ ] `model/scene3d.test.ts` — **먼저 작성**: hero(0)에서 A·B 회전이 `hero3d` 값 / archive 0.72에서 세 축 모두 0·중심 일치 / archive 0.86 이후 B opacity 0 / share 구간 좌우 배치는 기존 `computePhones`와 x가 같음.
- [ ] `model/toWorld.ts` + 테스트 — 화면 px 좌표 → 3D 월드 좌표 변환(카메라 fov·거리 기준). 뷰포트 중앙 = 월드 (0,0), 폰 높이가 `STAGE_LAYOUT` 기준 px 높이와 같게 보이도록.

## A. Spline 시도 (최대 하루로 제한)

### A1. 연결 (사람이 직접)
1. Spline 데스크톱 앱 설치 → 로그인 → 실행
2. 앱 설정 → MCP에서 Claude Code 토글 켜기 (앱이 `~/.claude.json`에 서버를 자동 등록)
3. Claude Code 재시작 → `/mcp`에서 spline이 connected인지 확인

### A2. 장면 만들기 (Claude가 MCP로)
- [ ] 새 Spline 파일 `heddy-hero`: 아이폰 모델 2개, 이름은 정확히 **`PhoneA`**, **`PhoneB`** (코드가 이 이름으로 찾음)
- [ ] 각 폰의 화면 면에 이미지 머티리얼: A = 홈 화면, B = AR 화면 (`public/screens/home.png`, `ar.png` — 사람이 앱 캡처를 넣어둠)
- [ ] 배경 투명, 카메라 고정(정면, 원근 약하게), 부드러운 조명 + 반사. 장면 안 애니메이션/이벤트는 만들지 않는다(움직임은 전부 코드가 제어)
- [ ] 스크린샷을 찍어 디자인 캡처(히어로 V자)와 비교

### A3. 연결 (코드)
- [ ] `pnpm add @splinetool/react-spline @splinetool/runtime`
- [ ] Spline Export → Code → Next.js → scene URL을 `NEXT_PUBLIC_SPLINE_HERO_SCENE` 환경변수로 (코드에 URL 하드코딩 금지)
- [ ] `widgets/phone-stage/ui/SplineStage.tsx`(client): `import Spline from "@splinetool/react-spline/next"`, `onLoad`에서 `app.findObjectByName("PhoneA" | "PhoneB")`를 ref에 저장 → `useSceneFrame`에서 `computePhones3D` 결과를 `toWorld`로 바꿔 `position` / `rotation` / `scale`에 대입. 프레임마다 setState 금지.
- [ ] 로드 전·실패 시엔 CSS 폰을 보여주고, 로드 완료 후 교체(깜빡임 없이 opacity 전환)

### A4. 통과 기준 (하나라도 실패 → B로)
- [ ] Claude가 MCP로 장면을 만들고 고칠 수 있다(폰 모델 추가·이름 지정·화면 이미지 교체)
- [ ] 코드에서 `findObjectByName`으로 두 폰의 위치·회전을 매 프레임 바꿀 수 있고, 스크롤 시 끊김이 없다(맥북 크롬 기준 체감 60fps, DevTools Performance에서 긴 프레임 없음)
- [ ] 첫 화면 로드: 느린 4G(DevTools 스로틀)에서 폰이 3초 안에 보인다(그 전엔 CSS 폰)
- [ ] 배포용 export에 워터마크·로고가 없고, 필요한 요금제 조건이 팀이 감당 가능하다
- [ ] `pnpm verify` · `pnpm build` 통과

→ 결과를 `docs/decisions/0003-hero-3d-renderer.md`에 적는다(채택/탈락, 어느 기준에서 막혔는지, 측정값).

## B. React Three Fiber (A 탈락 시)

- [ ] `pnpm add three @react-three/fiber @react-three/drei` (+ `pnpm add -D @types/three`)
- [ ] 아이폰 GLB 모델: Sketchfab/CGTrader 등에서 **상업적 사용 가능한 라이선스(CC0 또는 CC-BY)**만. 출처·라이선스를 `public/models/LICENSE.md`에 기록. 받은 뒤 압축:
  ```bash
  pnpm dlx @gltf-transform/cli optimize iphone.glb public/models/iphone.glb --compress draco --texture-compress webp
  ```
- [ ] `widgets/phone-stage/ui/PhoneCanvas.tsx`(client, `next/dynamic` `ssr: false`): 투명 `<Canvas>`를 fixed 레이어에, `frameloop="demand"`. `useGLTF`로 모델 로드 → 두 인스턴스(`clone`) → 화면 메시 머티리얼을 `useTexture("/screens/home.png" | "ar.png")`로 교체. `<Environment preset="studio" />`로 반사.
- [ ] `useSceneFrame`에서 `computePhones3D` → `toWorld` 결과를 두 그룹의 `position/rotation/scale`에 대입하고 `invalidate()` 호출(스크롤할 때만 렌더).
- [ ] 이후 섹션의 화면 전환(`computeScreens`)은 화면 머티리얼의 텍스처 교체 또는 두 텍스처 크로스페이드로 처리 — 1차 범위는 hero~archive만, 나머지는 CSS 폰으로 넘겨받아도 된다(archive 끝에서 3D → CSS 교체, 수렴 완료 시점이라 정면이라 이음매가 안 보임).
- [ ] 로드 전·WebGL 없음·reduced motion → CSS 폰 폴백.
- [ ] 결과를 `docs/decisions/0003-hero-3d-renderer.md`에 기록.

## 완료 기준

- [ ] `pnpm test -- scene3d toWorld` 통과, `pnpm verify` · `pnpm build` 통과
- [ ] `pnpm dev` + `pnpm snap --only=hero,archive` → 히어로에서 두 폰이 서로 다른 3D 각도(옆면이 보임), archive 0.72 이후 정면 한 대로 겹침
- [ ] 스크롤을 위아래로 반복해도 폰이 튀거나 사라지지 않음(역방향 스크롤 포함)
- [ ] reduced motion 켜고 확인 → CSS 폰으로 정상 표시
- [ ] `docs/decisions/0003` 작성, `docs/plans/README.md` 표 갱신

## 사람이 준비할 것

- 앱 화면 캡처 2장(홈, AR) → `public/screens/home.png`, `ar.png` (세로 1170×2532 권장, 상태바 포함)
- A를 할 때: Spline 계정·데스크톱 앱 설치와 MCP 토글
- B로 갈 때: 쓸 아이폰 모델 선택(라이선스 확인)

## 참고

- Spline MCP: https://docs.spline.design/generate/spline-mcp-server
- react-spline(Next.js import, onLoad / findObjectByName): https://github.com/splinetool/react-spline
- Spline 코드 export: https://docs.spline.design/exporting-your-scene/web/exporting-as-code
- R3F 모델 로딩: https://r3f.docs.pmnd.rs/tutorials/loading-models

## 변경 기록

- 2026-09-30: 생성. Spline 우선 시도 → 통과 기준 미달 시 R3F로 전환하기로 함.
