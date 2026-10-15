import type { Range } from "@/shared/lib/motion";

/** 폰 목업 치수 (`docs/design/spec.md` §2) */
export const PHONE = {
  width: 300,
  height: 615,
  /** 회전축(하단 중심) y 오프셋. 실제 pivot은 여기에 스케일(S)을 곱한다 */
  pivot: 307.5,
  frameColor: "#1C1E20",
  frameRadius: 42,
  /** 베젤(화면 inset) — 3D 폰처럼 얇게(원본 10, 2026-10-05 조정) */
  screenInset: 6,
  screenWidth: 288,
  screenHeight: 603,
  screenRadius: 38,
  screenBackground: "#FBFBFB",
  shadow: "0 40px 70px -30px rgba(13,13,13,.45)",
} as const;

/** 폰 스테이지 레이아웃 (`docs/design/spec.md` §2) */
export const STAGE_LAYOUT = {
  desktop: {
    /** 이 너비(px) 이상이면 데스크톱 레이아웃 */
    breakpoint: 1024,
    /**
     * 폰 크기 상한·뷰포트 높이 비율 — 원본(1 / 0.78)이 커서 줄였다가(2026-10-01, 0.8 / 0.5),
     * 팀 피드백 "목업을 더 크게"로 다시 키웠다가(2026-10-14, 0.62) 카피가 눈에 안 들어온다는 의견으로 줄임(2026-10-15)
     */
    scaleCap: 1,
    scaleHeightRatio: 0.54,
    scaleWidthDivisor: 1400,
    /**
     * 폰 가로 중심(스크롤바를 뺀 폭 기준) — 원본 0.7 → 0.65 → 0.68(2026-10-14) → 화면 가장자리에서 떨어지게
     * 가운데 쪽으로 0.64(2026-10-15)
     */
    centerXRatio: 0.64,
    centerYOffset: 20,
    /** 좌측 카피 최대 너비(vw) — `SectionShell`의 lg:max-w와 같다 */
    copyMaxWidthVw: 50,
    /** hero→archive 수렴 시 폰 A/B가 벌어지는 거리(px, 스케일 전) */
    convergeDx: 105,
  },
  mobile: {
    scaleCap: 0.52,
    scaleHeightRatio: 0.39,
    /**
     * 히어로 3D 폰 두 대(V자, 씬 폭 ≈ 924)가 화면 폭 안에 들어오게 — 924 / 0.96(이슈 #50, 원본 620은 큰 폰에서 잘림)
     */
    scaleWidthDivisor: 960,
    centerXRatio: 0.5,
    /** 위 카피 아래 남는 공간의 가운데(원본 0.7, 이슈 #50) */
    centerYRatio: 0.66,
    /** 상단 카피 시작 위치(svh, 원본 14vh) */
    copyTopVh: 10,
    convergeDx: 80,
  },
  /** hero→archive 수렴 시 폰 기울기(도) */
  heroTilt: 12,
} as const;

/**
 * 히어로 3D 폰(Spline 씬, `docs/plans/0003`). 합체 모션은 Spline 안의 State + Scroll 이벤트가 맡고,
 * 코드는 캔버스 위치·크기와 CSS 폰으로 넘기는 페이드만 담당한다.
 * 씬의 PhoneA "Merged" 상태가 월드 원점(높이 615, rotX -8 = `PhoneFrame`의 rotateX(8deg))이라,
 * 캔버스 중심을 CSS 폰 A 중심에 두고 높이를 맞추면 넘겨받을 때 이음새가 없다.
 */
export const PHONE_3D = {
  /** Spline 씬 카메라: 정면(0,0,distance), 세로 시야각(도, Spline 기본값 45). 씬과 같은 값이어야 한다 */
  camera: { fovDeg: 45, distance: 1700 },
  /**
   * Spline Scroll 이벤트가 합체를 끝내는 페이지 스크롤 위치(px). 씬 값과 같아야 한다:
   * PhoneA 900+778, PhoneB 993+685 → 둘 다 1678. Spline은 px 고정이라 뷰포트와 무관하다.
   */
  mergeEndScrollPx: 1678,
  /**
   * 합쳐진 PhoneA의 화면(ScreenA = RecordBase 윤곽, 씬 단위 = px). 리포트 구간은 이 위에 HTML 화면을
   * CSS 3D로 투영해 겹친다(`docs/plans/0005`). z는 폰 중심에서 화면 면까지(RecordLayer 0.08×222.84 + 0.3),
   * tiltDeg는 합쳐진 자세의 뒤로 눕힘(씬 rotX −8°).
   * 베젤을 얇게 하려고 ScreenA를 274×596 → 280×601로 키우고 RecordLayer도 같은 크기로 맞췄다(2026-10-05).
   * 한쪽 베젤 ≈ 폰 폭의 1.6%(원본 ≈ 3%).
   * corner는 화면 모서리(스쿼클, `squirclePoints`): 렌더된 3D 화면 윤곽을 4배 해상도로 재서 맞춘 반경·지수
   * (평균 오차 1px 안쪽, 2026-10-15). 원래 타원 38/59는 모서리가 베젤 밖으로 뾰족하게 튀어나왔다.
   */
  screen: {
    width: 280,
    height: 601.4,
    z: 18,
    tiltDeg: 8,
    corner: { radius: 52, exponent: 2.5 },
  },
  /**
   * 다이내믹 아일랜드(ScreenA에 뚫린 구멍 = 뒤의 검은 유리). 화면 좌상단 기준 px.
   * 기록 화면(RecordIsland)과 상세 화면 오버레이는 화면을 덮으므로 같은 자리에 다시 그린다.
   */
  island: { centerY: 22.6, width: 87.1, height: 25.1 },
  /**
   * 히어로 포스터(이슈 #46): Spline이 그리기 전 서버 HTML에서 바로 보이는 히어로 첫 화면 이미지
   * (`public/screens/hero/poster.webp`, 캔버스 3030×1894 렌더에서 폰·그림자만 잘라냄). 값은 캔버스 대비 비율.
   */
  poster: { left: 0.267, top: 0.3321, width: 0.4099, height: 0.5533 },
  /**
   * 포스터 이미지 — 모바일 히어로(이슈 #52)도 같은 파일·같은 sizes를 써서 한 번만 내려받는다
   * (데스크톱 포스터는 모바일에서 숨겨도 이미지는 받아지므로 주소를 맞춘다)
   */
  posterImage: { src: "/screens/hero/poster.webp", sizes: "(min-width: 1024px) 740px, 420px" },
  /** 포스터는 히어로 자세가 그대로인 동안만 맞다 — Spline Scroll 이벤트(합체)가 시작되는 스크롤 위치(PhoneA 900) */
  posterMaxScrollPx: 900,
  /** 3D 캔버스가 다 나타난 뒤(페이드 500ms) 포스터를 숨기기까지(ms) */
  posterHideDelayMs: 600,
} as const;

/**
 * 리포트 구간 폰 화면 — 다운펌 분석완료 상세 화면 이미지(713×2000)를 3장으로 자른 치수(`docs/plans/0005`).
 * 상단(상태바+앱바)과 하단(탭바)은 고정, 본문만 페이지 스크롤에 따라 폰 안에서 올라간다.
 */
export const DETAIL_SCREEN = {
  imageWidthPx: 713,
  fixedTopPx: 263,
  /** fixedTop 중 상태바(시간·배터리) 높이 — 기록 → 상세 push 때 상태바는 그대로 둔다 */
  statusBarPx: 85,
  bodyHeightPx: 1537,
  fixedBottomPx: 200,
  /**
   * 본문 이미지 속 "상태 지표" 막대 4개(이미지 px). 이미지 위에 같은 자리로 HTML 막대를 덮어
   * 섹션 카피 막대와 같은 순간·같은 시차·같은 길이(`TIMELINE.report.barValues`)로 채운다.
   */
  bars: {
    centerY: [972.5, 1087.5, 1203.5, 1318] as readonly number[],
    x: 58,
    width: 600,
    height: 10,
  },
} as const;

/**
 * record 섹션 3D 기록 스택 (`docs/plans/0004`). 좌표는 폰 화면 기준 px(좌상단 원점, y 아래로),
 * 각도는 도. Spline 씬의 RecordRig·RecordLayer·Card01~12와 같은 값이어야 한다.
 */
export const RECORD_STACK = {
  /** 기울어진 자세: 폰 A(정면)에 더해지는 RecordRig 회전 — 이미지 2 각도 */
  tiltPose: { rotX: 0, rotY: -25, rotZ: -15 },
  /** 화면(= Spline PhoneA ScreenA) 크기. 씬 단위 = px */
  screen: { width: 804 / 3, height: 1748 / 3 },
  /**
   * 첫 카드(slot 0) 윗변 y, 카드 크기, 슬롯 간격, 하단 네비 윗변 y — 실제 기록 화면(804×1748)을
   * 1/3로 줄인 값. 카드 크기는 그림자 여백을 뺀 카드 본체(724×236) 기준이다(Spline Card01~12와 같음).
   * 카드는 네비 뒤로 들어가 clipBottom에서 잘린다(네비가 카드를 덮는다).
   */
  listTop: 330 / 3,
  card: { width: 724 / 3, height: 236 / 3 },
  slotGap: 268 / 3,
  navTop: 1536 / 3,
  /**
   * 카드가 내려갈 수 있는 가장 아래 y. 화면 아래 둥근 모서리(반경 ~34) 위에서 멈춰야
   * 네비 뒤에서 잘리는 카드 모서리가 폰 테두리 쪽으로 뾰족하게 삐져나오지 않는다.
   */
  clipBottom: 1748 / 3 - 34,
  /**
   * 새 카드의 팝: 화면에 붙은 채 살짝 커진다(폰 밖으로 나가거나 화면 위로 뜨지 않는다).
   * z는 같은 면에서 겹칠 때 위에 오도록 하는 아주 작은 값, faceCamera는 리그 Y회전을 되돌리는 비율.
   */
  pop: { z: 0.4, x: 0, scale: 1.04, faceCamera: 0 },
  /** 흐림 막이 비워 두는 slot 0 띠의 위아래 여백(팝 카드는 이 띠 안에서 선명하게 보인다) */
  veilBandPad: 4,
  /** 새 카드가 들어올 때 시작 크기 비율(토스처럼 작게 시작해 커지며 튀어나온다, 회전 없음) */
  enterScaleFrom: 0.6,
  /** 스크롤을 빨리 내려도 끊기지 않게, 표시 위치가 실제 스크롤을 따라잡는 반감기(ms) */
  smoothHalfLifeMs: 90,
  /** 흐림 막 최대 불투명도 */
  veilAlpha: 0.55,
} as const;

/**
 * 모든 스크롤 구간의 단일 출처 (`docs/design/spec.md` §2~5).
 * 값 대부분은 섹션 진행도(0~1) 기준 `Range`이며, 주석에 어떤 진행도인지 적는다.
 */
export const TIMELINE = {
  // --- 폰 A/B 자세 (§3) ---
  /** archive 진행도: hero→archive 폰 A/B 수렴 */
  heroArchiveConverge: [0, 0.72] as Range,
  /** archive 진행도: 폰 B 페이드아웃(끝나면 B=0) */
  archiveBFade: [0.72, 0.86] as Range /** ar 진행도: 폰 A 재등장 y (yOffset) */,
  arReappearY: [0.46, 0.56] as Range,
  /** ar 진행도: 폰 A 재등장 opacity */
  arReappearOpacity: [0.46, 0.53] as Range,
  /**
   * share 진행도: 폰 A/B x 이동(sh) — A가 공유 링크를 만든 뒤(QR 모달) B가 들어온다(`docs/plans/0009`,
   * 원본 [0.1, 0.32]에서 레퍼런스 영상 순서에 맞춰 뒤로 미룸)
   */
  shareXShift: [0.38, 0.52] as Range,
  /** share 진행도: QR 비행(원본 [0.44, 0.7]) */
  qrFlight: [0.56, 0.7] as Range,
  /** QR 비행 f(0~1) 중 끝에서 페이드아웃되는 구간 */
  qrFlightEndFade: [0.82, 1] as Range,
  /** share 진행도: 폰 B 스캔 화면 → 공유된 시술기록 화면(원본 [0.7, 0.8]) */
  bScanToWebview: [0.71, 0.75] as Range,

  // --- 폰 화면 크로스페이드 (§4) ---
  /** 섹션 end 이후 뷰포트 높이의 35~65% 구간에서 다음 화면으로 전환 */
  screenCrossfadeBand: [0.35, 0.65] as Range,

  // --- 섹션별 모션 (§5, 상세 구현은 각 섹션 위젯에서 TODO로 남김) ---
  record: {
    /** record 진행도: 기록 12건이 한 건씩 추가되는 구간 (`docs/plans/0004`) */
    band: [0.06, 0.94] as Range,
    /** record.top 기준 뷰포트 높이 배수: 폰이 한 바퀴 돌며 기울어지는 구간 */
    spinVh: [-0.6, 0.15] as Range,
    /** 한 건 추가 스텝(0~1) 중 밀림·등장·튀어나옴이 끝나는 지점. 나머지는 멈춰서 읽는 시간 */
    stepEnter: 0.45,
    /** record 진행도: 마지막 카드가 내려앉고 폰이 정면으로 돌아오는 구간 */
    settle: [0.94, 1] as Range,
  },
  report: {
    /** 막대 i: top - 0.3H + i·0.06H ~ top + 0.4L + i·0.06H (H=뷰포트, L=섹션 스크롤 길이) */
    barStartOffsetVh: -0.3,
    barStaggerVh: 0.06,
    barDurationRatioOfL: 0.4,
    /**
     * 막대 i가 다 찼을 때 길이(트랙 대비) — 폰 상세 화면 "상태 지표" 점수(색 균일도 78·볼륨 균형 64·
     * 형태 대칭성 71·거칠기 징후 41) 비례. 섹션 카피 막대와 폰 화면 막대가 같이 쓴다.
     */
    barValues: [0.78, 0.64, 0.71, 0.41] as readonly number[],
    /** report 진행도: 폰 안 상세 화면 본문이 위로 스크롤되는 구간(`docs/plans/0005`) */
    detailScroll: [0.1, 0.9] as Range,
    /**
     * 기록 → 리포트(상세) 화면 크로스페이드: record 섹션 end 기준 뷰포트 높이 배수.
     * 공통 밴드(end 이후 35~65%)보다 앞당겨, 리포트 섹션이 붙을 때 이미 상세 화면이 다 보이게 한다.
     */
    fromRecordBand: [-0.45, -0.15] as Range,
    /**
     * 3D 폰에서 기록 → 상세: 맨 위 카드(최신 기록)를 누르고(tap) 상세 화면이 오른쪽에서 밀려 들어온다(push).
     * record 섹션 end 기준 뷰포트 높이 배수. push가 끝나는 지점은 fromRecordBand 끝과 같다.
     */
    tapBand: [-0.5, -0.34] as Range,
    pushBand: [-0.34, -0.15] as Range,
    /** 눌릴 때 카드가 줄어드는 최대 비율 */
    tapPressScale: 0.05,
    /** push 중 뒤 화면(기록 리스트)이 어두워지는 최대 불투명도 */
    pushDimAlpha: 0.12,
  },
  recommend: {
    /**
     * 리포트 상세 → 추천 화면: 하단 "추천" 탭을 눌렀다 떼고(tap, 물결) 추천 화면이 오른쪽에서 밀려
     * 들어온다(slide, 탭이 오른쪽에 있으니). report 섹션 end 기준 뷰포트 높이 배수(`docs/plans/0007`).
     * 추천 섹션이 화면에 붙을 때(recommend 진행도 0) 이미 다 넘어가 있다.
     */
    tabTapBand: [-0.62, -0.46] as Range,
    tabSlideBand: [-0.46, -0.2] as Range,
    /** tap 진행도 중 탭바 활성 색이 기록 → 추천으로 옮겨 가는 구간 */
    tabActiveIn: [0.35, 0.65] as Range,
    /** recommend 진행도: 카드 i가 폰 밖으로 떠오르는 구간 = [start + i·stagger, start + i·stagger + duration] */
    cardPop: { start: 0.06, stagger: 0.07, duration: 0.18 },
    /** recommend 진행도: 카드 i가 제자리로 돌아가는 구간(위와 같은 식) */
    cardReturn: { start: 0.6, stagger: 0.03, duration: 0.12 },
    /** recommend 진행도: 폰 화면 본문이 "추천 근거 데이터"까지 내려가는 구간 */
    screenScroll: [0.8, 0.97] as Range,
  },
  ar: {
    /**
     * pill → 다크 패널 확대 구간(ar 진행도). 원본은 3단계(a .02~.1 · b .1~.2 · c .2~.28)를 따로 이징해 단계마다
     * 멈췄다 커졌다 — 한 곡선으로 잇고 구간을 줄였다(이슈 #43, 2026-10-13). 팀 피드백 "더 빠르게"로
     * 0.14 → 0.08(스크롤 약 반 화면, 2026-10-14)
     */
    pillMorph: [0.02, 0.08] as Range,
    /** 확대 진행도(0~1)에서 시작 · a · b · 전체 크기를 지나는 시점 — 크기는 로그 스케일 단조 3차 보간 */
    pillKnots: [0, 0.33, 0.85, 1] as readonly number[],
    pillFadeIn: [0, 0.02] as Range,
    /** 패널 문구("머릿속 상상을 지우고 / 이제는 눈앞의 결과로") in/out — 패널이 다 덮자마자 나온다 */
    panelCopyIn: [0.09, 0.14] as Range,
    panelCopyOut: [0.4, 0.44] as Range,
    /** 카피("거울 앞에 앉기 전에, 먼저 비춰보세요") in */
    copyIn: [0.46, 0.54] as Range,
    /**
     * 스타일 전환 지점(ar 진행도): 스크롤이 이 값을 넘으면 다음 스타일로 바뀐다. 원본은 스크롤로 전환을 문질러
     * (t2 = R(p, .62~.72), t3 = R(p, .80~.90)) 머리 두 개가 겹친 중간 장면에 멈출 수 있었다 — 팀 피드백으로
     * 각 구간 가운데를 근사값으로 잡고, 넘으면 전환 한 번이 시간(styleDurationMs)으로 재생된다(2026-10-14)
     */
    styleSteps: [0.67, 0.85] as readonly [number, number],
    styleDurationMs: 900,
    /** 확대 진행도(pillMorph 안, 이징 전)가 이 값을 넘으면 다크 패널이 화면을 덮은 것으로 보고 헤더 로고를 숨긴다 */
    darkPanelHeaderHideThreshold: 0.95,
    /**
     * 스타일 전환 한 번(t = 0~1) 안의 단계(레퍼런스 영상 2, `docs/plans/0008`):
     * 다음 썸네일에 터치 표시 → 캐러셀이 밀려 선택이 가운데로 → 캐릭터 이미지 교체. 스타일 이름은 캐러셀이
     * 반쯤 밀렸을 때 바뀐다. 이미지는 원본 R(t, .4~1)로 길게 겹쳤는데, 겹친 머리가 보이지 않게 짧게 바꾼다.
     */
    styleTouch: [0, 0.32] as Range,
    styleSlide: [0.18, 0.62] as Range,
    styleImage: [0.5, 0.62] as Range,
  },
  share: {
    /**
     * AR → 기록 공유 화면 크로스페이드: ar 섹션 end 기준 뷰포트 높이 배수. share 섹션이 화면에 붙을 때
     * (share 진행도 0) 이미 공유 화면이 다 보인다(`docs/plans/0009`).
     */
    fromArBand: [-0.5, -0.2] as Range,
    /** share 진행도: 토글 i(시술 내용 · 만족도 · AR 후보)를 누르는 구간 = [start + i·stagger, … + duration] */
    toggleTap: { start: 0.03, stagger: 0.06, duration: 0.05 },
    /** 탭 진행도 중 토글 손잡이가 옮겨 가는 구간 */
    toggleKnob: [0.35, 0.85] as Range,
    /** share 진행도: 화면이 내려가 "취소 / 공유 링크 생성" 버튼이 드러나는 구간 */
    buttonsReveal: [0.21, 0.26] as Range,
    /** share 진행도: "공유 링크 생성"을 누르는 구간 */
    linkTap: [0.27, 0.31] as Range,
    /** share 진행도: 다운펌 상세(어두워짐) 위로 QR 모달이 뜨는 구간 */
    qrModal: [0.31, 0.36] as Range,
    /** share 진행도: 폰 B에 체크 표시가 떴다가 사라지는 구간 */
    checkIn: [0.71, 0.76] as Range,
    checkOut: [0.84, 0.9] as Range,
    /** 섹션 부제 */
    subtitleIn: [0.74, 0.88] as Range,
    /**
     * 기록 공유 → closing 홈 화면: share 고정 끝 기준 뷰포트 높이 배수(`docs/plans/0010`). 원본 "share 끝 이후
     * 30~70%"는 페이지 끝을 넘어 닿지 않았다 — 폰이 closing 자리로 가는 동안(고정 끝 ~ share.end) 바뀐다.
     */
    toClosingHomeBand: [0.25, 0.65] as Range,
  },
} as const;

/**
 * closing 섹션 폰 A 자세(데스크톱, `docs/plans/0010`): 오른쪽에 정면으로 크게 선다. share 고정 끝 ~ share.end
 * 동안 share 자리에서 여기로 옮겨 간다. 모바일은 지금처럼 가운데로 돌아온다.
 */
export const CLOSING_PHONE = {
  /** 원본 0.78 · 0.8 — 폰이 카피·스토어 버튼보다 눈에 띄어 가운데 쪽으로 옮기고 줄임(2026-10-15) */
  centerXRatio: 0.7,
  centerYRatio: 0.5,
  /** 폰 높이 / 뷰포트 높이 */
  heightRatio: 0.66,
  /** 폰 오른쪽 끝과 뷰포트 오른쪽 사이 최소 여백(px) — 좁은 화면에선 이 안에 들어가게 줄인다 */
  edgeMarginPx: 32,
} as const;

/**
 * 관성 스크롤(이슈 #43): 휠 한 번에 페이지가 뚝 점프하지 않고 목표 위치를 반감기로 따라간다.
 * 터치는 기본 스크롤, reduced motion이면 끈다.
 */
export const SMOOTH_SCROLL = {
  /** 남은 거리가 절반이 되는 시간(ms) — 클수록 미끄럽고 느리다 */
  halfLifeMs: 100,
  /** 남은 거리가 이 값(px) 아래면 목표에 붙이고 멈춘다 */
  settlePx: 0.5,
  /** 애니메이션 중 실제 스크롤이 마지막으로 쓴 위치와 이만큼(px) 넘게 다르면 다른 입력(키보드·스크롤바)으로 보고 멈춘다 */
  externalJumpPx: 3,
} as const;

/** 모바일 주소창 대응(이슈 #50): 터치 기기에서 이 정도(px) 높이 변화는 주소창이 접히고 펴진 것으로 보고 무시한다 */
export const STABLE_VIEWPORT = {
  toolbarSlackPx: 150,
} as const;

/** 헤더: 스크롤 양만큼 위로 밀려 올라가고(숨김), 위로 올리면 같은 양만큼 내려온다 */
export const HEADER = {
  /** 이 위치(px) 이하에서는 항상 완전히 보인다 */
  alwaysVisibleY: 0,
  /** 스크롤 입력이 이만큼(ms) 없으면 걸쳐 있던 헤더를 완전히 보이거나 숨긴다 */
  settleIdleMs: 140,
} as const;

/**
 * 추천 화면 — 피그마 landing / S6-스타일추천(964:2081). 피그마 px(폭 402) 그대로 짜고 화면 폭에 맞춰
 * 통째로 줄인다(`docs/plans/0007`). 상단(상태바+제목)·하단(탭바)은 고정, 본문만 스크롤된다.
 */
export const RECOMMEND_SCREEN = {
  designWidth: 402,
  fixedTop: 112,
  fixedBottom: 106,
  /** 회색 본문 높이(카드 3장 + 추천 근거 데이터) */
  bodyHeight: 911,
  /** 본문 안 카드 슬롯: 왼쪽 x, 첫 카드 윗변 y, 크기, 다음 카드까지 간격 */
  card: { x: 19, firstTop: 75, width: 363, height: 137, pitch: 150 },
  /**
   * 카드 사진(117×117 칸)에 같은 사진 한 장을 카드마다 다르게 잘라 넣는다(피그마 그대로):
   * 칸 기준 사진 위치·크기(px)와 칸 모서리 반경.
   */
  photoCrops: [
    { left: -116, top: 0, size: 350, radius: 10 },
    { left: -255.77, top: -5.44, size: 376.85, radius: 13.6 },
    { left: -115.64, top: -115.64, size: 348.28, radius: 13.6 },
  ],
  /**
   * 폰 밖으로 떠오른 자세(피그마 px, 슬롯 기준 이동량) — 레퍼런스 영상처럼 오른쪽으로 비켜 나며
   * 살짝 엇갈려 기운다. 카드 i마다 y·회전이 다르다.
   */
  pop: { dx: 330, dy: [-12, 8, 24], rotateDeg: [-4, 3, -3], scale: 1.06 },
  /** 모바일에선 떠오른 카드 오른쪽 끝이 화면 오른쪽에서 이만큼(px) 안쪽에 오게 dx를 줄인다(이슈 #50) */
  popMobileEdgeMarginPx: 8,
  /** 탭바 속 "추천" 아이콘 중심(탭바 좌상단 기준 px) — 상세 → 추천 탭 전환 때 누르는 자리 */
  recommendTabCenter: { x: 279, y: 33.4 },
} as const;

/**
 * AR 섹션 다크 패널(`docs/design/spec.md` §5 ar, `docs/plans/0008`). pill은 "거울 앞에 | 앉기 전에" 사이에서
 * 교차축·주축이 a → b → c 단계로 커져 화면을 덮는다. 데스크톱은 세로 pill(교차축 = 폭), 모바일은 가로 pill.
 */
export const AR_PANEL = {
  color: "#0D0D0D",
  /** pill 시작 크기(교차축, 주축)와 a 단계 끝 크기(px) */
  pillStart: { cross: 26, main: 58 },
  pillA: { cross: 58, main: 236 },
  /** b 단계 끝 크기 — 뷰포트 대비 비율. 데스크톱 교차축 0.5W·주축 0.72H(원본), 모바일은 가로 pill이라 축이 바뀜 */
  pillB: {
    desktop: { crossOfWidth: 0.5, mainOfHeight: 0.72 },
    mobile: { crossOfHeight: 0.42, mainOfWidth: 0.86 },
  },
  /** 모서리 반지름 상한(px) — 작을 땐 알약, 커지면 둥근 사각형이 되어 타원처럼 보이지 않는다(이슈 #43) */
  maxRadius: 40,
  /** 분할 문구와 pill 가장자리 사이 간격(px) */
  splitGap: 20,
  /** 패널 문구·카피가 들어올 때 아래에서 올라오는 거리(px) */
  panelCopyRisePx: 24,
  copyRisePx: 20,
} as const;

/**
 * AR 화면 — 피그마 landing / S5-AR화면1·2·3을 HTML로 옮긴 치수(폭 402, 피그마 px, `docs/plans/0008`).
 * 상태바(54)·홈 인디케이터(34)는 흰 바탕, 그 사이가 카메라(캐릭터) 화면이다.
 */
export const AR_SCREEN = {
  designWidth: 402,
  statusBar: 54,
  homeIndicator: 34,
  /** 캐릭터 이미지(402×874) 윗변 — 피그마에서 콘텐츠 영역보다 44 위에 놓여 있다 */
  imageTop: 10,
  /** 컨트롤 묶음(스타일 이름 줄 → 캐러셀 → 탭 이름) 윗변과 줄 간격 */
  controlsTop: 603,
  controlsGap: 40,
  /** 캐러셀: 선택과의 거리 0·1·2에서 지름, 썸네일 사이 간격 */
  carouselSizes: [80, 62, 50],
  carouselGap: 25,
  /** 선택 썸네일 테두리 두께(px) */
  selectedBorder: 2.5,
  /**
   * 캐러셀 항목(원형으로 돈다). none = 스타일 없음 버튼, 나머지는 썸네일과 피그마 자르기
   * (지름 대비: 사진 폭·높이, 왼쪽·위 위치). style = 캐릭터가 바뀌는 스타일 순서(0~2), 없으면 -1.
   */
  carousel: [
    { key: "none", style: -1 },
    { key: "full-bang", style: 0, crop: { w: 1.098, h: 1.958, left: -0.05, top: -0.19 } },
    { key: "down-perm", style: 1, crop: { w: 1, h: 1.1964, left: 0, top: -0.0982 } },
    { key: "part-dandy", style: 2, crop: { w: 2.839, h: 2.839, left: -0.935, top: 0.016 } },
    { key: "extra", style: -1, crop: { w: 1, h: 1.74, left: 0, top: -0.1 } },
  ],
  /** 캐러셀에서 스타일 i가 있는 자리 — 스타일 0(일자 풀뱅)이 처음 선택 */
  styleCarouselIndex: [1, 2, 3],
} as const;

/**
 * 공유 화면들 — 피그마 landing / S4-공유화면 · S4-공유QR화면 · S3-시술기록 공유를 HTML로 옮긴 치수
 * (폭 402, 피그마 px, `docs/plans/0009`).
 */
export const SHARE_SCREEN = {
  designWidth: 402,
  statusBar: 54,
  /** 상단 고정(상태바 + 제목 줄)과 하단 탭바 높이 */
  fixedTop: 112,
  tabBar: 106,
  /** 공유 항목 줄: 첫 줄 중심 y(본문 기준)와 줄 높이, 토글 중심 x */
  rows: { firstCenterY: 88.9, pitch: 53, toggleCenterX: 353.5 },
  /** 켜는 토글(줄 인덱스) — 사진은 꺼 둔 채로, 나머지 셋을 차례로 켠다(피그마 S4 최종 상태) */
  toggledRows: [1, 2, 3],
  /** 버튼 줄: 본문 기준 윗변, 높이, "공유 링크 생성" 버튼 중심 x */
  buttons: { top: 665, height: 42, linkCenterX: 293 },
  /** 버튼이 드러난 뒤 탭바 위 여백 */
  buttonsMargin: 16,
  /** QR 모달(290×408, 화면 가운데)과 그 안 QR(189) 중심 — 모달 중심 기준 */
  qrModal: { width: 290, height: 408, qrSize: 189, qrOffsetY: -32.5 },
  /** 폰 B 스캔 화면 틀: 크기와 중심 y(화면 높이 비율) */
  scanFrame: { size: 196, centerYRatio: 0.44 },
} as const;
