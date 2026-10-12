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
    /** 폰 크기 상한·뷰포트 높이 비율 — 원본(1 / 0.78)이 커서 사용자 요청으로 줄임(2026-10-01) */
    scaleCap: 0.8,
    scaleHeightRatio: 0.5,
    scaleWidthDivisor: 1400,
    /** 폰 가로 중심 — 카피 오른쪽 빈 영역의 가운데(원본 0.7, 2026-10-01 조정) */
    centerXRatio: 0.65,
    centerYOffset: 20,
    /** 좌측 카피 최대 너비(vw) */
    copyMaxWidthVw: 40,
    /** hero→archive 수렴 시 폰 A/B가 벌어지는 거리(px, 스케일 전) */
    convergeDx: 105,
  },
  mobile: {
    scaleCap: 0.52,
    scaleHeightRatio: 0.39,
    scaleWidthDivisor: 620,
    centerXRatio: 0.5,
    centerYRatio: 0.7,
    /** 상단 카피 시작 위치(vh) */
    copyTopVh: 14,
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
  /** CSS 폰 A로 크로스페이드하는 스크롤 길이(px) */
  handoffScrollPx: 140,
  /**
   * 합쳐진 PhoneA의 화면(ScreenA = RecordBase 윤곽, 씬 단위 = px). 리포트 구간은 이 위에 HTML 화면을
   * CSS 3D로 투영해 겹친다(`docs/plans/0005`). z는 폰 중심에서 화면 면까지(RecordLayer 0.08×222.84 + 0.3),
   * tiltDeg는 합쳐진 자세의 뒤로 눕힘(씬 rotX −8°). 모서리는 가로·세로 반경이 다른 스쿼클이다.
   * 베젤을 얇게 하려고 ScreenA를 274×596 → 280×601로 키우고 RecordLayer도 같은 크기로 맞췄다(2026-10-05).
   * 한쪽 베젤 ≈ 폰 폭의 1.6%(원본 ≈ 3%).
   */
  screen: { width: 280, height: 601.4, z: 18, tiltDeg: 8, radiusX: 38, radiusY: 59 },
  /**
   * 다이내믹 아일랜드(ScreenA에 뚫린 구멍 = 뒤의 검은 유리). 화면 좌상단 기준 px.
   * 기록 화면(RecordIsland)과 상세 화면 오버레이는 화면을 덮으므로 같은 자리에 다시 그린다.
   */
  island: { centerY: 22.6, width: 87.1, height: 25.1 },
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
  /** share 진행도: 폰 A/B x 이동(sh) */
  shareXShift: [0.1, 0.32] as Range,
  /** share 진행도: QR 비행 */
  qrFlight: [0.44, 0.7] as Range,
  /** QR 비행 f(0~1) 중 끝에서 페이드아웃되는 구간 */
  qrFlightEndFade: [0.82, 1] as Range,
  /** share 진행도: 폰 B 스캔 화면 → 웹뷰 화면 */
  bScanToWebview: [0.7, 0.8] as Range,

  // --- 폰 화면 크로스페이드 (§4) ---
  /** 섹션 end 이후 뷰포트 높이의 35~65% 구간에서 다음 화면으로 전환 */
  screenCrossfadeBand: [0.35, 0.65] as Range,
  /** share 끝 이후 30~70% 구간에서 폰 A가 QR 공유 화면 → 홈 화면으로 되돌아간다 */
  shareEndToHomeBand: [0.3, 0.7] as Range,

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
    /** 선 i: top - 0.2H + i·0.12L ~ top + 0.2L + i·0.12L */
    lineStartOffsetVh: -0.2,
    lineStaggerRatioOfL: 0.12,
    lineDurationRatioOfL: 0.2,
    /** 미니 카드 opacity 0.35 + 0.65×R(v, 0.85~1) */
    miniCardFadeIn: [0.85, 1] as Range,
  },
  ar: {
    /** pill 교차축/주축 모핑 3단계 */
    pillMorphA: [0.02, 0.1] as Range,
    pillMorphB: [0.1, 0.2] as Range,
    pillMorphC: [0.2, 0.28] as Range,
    pillFadeIn: [0, 0.02] as Range,
    /** 패널 문구("머릿속 상상을 지우고 / 이제는 눈앞의 결과로") in/out */
    panelCopyIn: [0.28, 0.33] as Range,
    panelCopyOut: [0.4, 0.44] as Range,
    /** 카피("거울 앞에 앉기 전에, 먼저 비춰보세요") in */
    copyIn: [0.46, 0.54] as Range,
    /** 스타일 3종 전환 가중치 t2/t3 */
    styleTransition2: [0.62, 0.72] as Range,
    styleTransition3: [0.8, 0.9] as Range,
    /** 이 값(c) 초과면 다크 패널이 화면을 덮은 것으로 보고 헤더를 숨긴다 */
    darkPanelHeaderHideThreshold: 0.95,
  },
  share: {
    /** QR clip-path inset 진행 */
    qrClipIn: [0, 0.16] as Range,
    /** "기록을 전달했어요" 문구 */
    deliveredCopyIn: [0.72, 0.8] as Range,
    /** 섹션 부제 */
    subtitleIn: [0.74, 0.88] as Range,
  },
} as const;

/** 헤더: 아래로 스크롤하면 숨기고, 위로 올리면 다시 보인다 */
export const HEADER = {
  /** 이 위치(px) 이하에서는 항상 보인다 */
  alwaysVisibleY: 8,
  /** 방향이 바뀐 지점에서 이만큼(px) 내려가야 숨긴다 — 살짝 흔들리는 스크롤에 깜빡이지 않게 */
  hideDistance: 24,
  /** 방향이 바뀐 지점에서 이만큼(px) 올라가야 다시 보인다 */
  showDistance: 12,
} as const;
