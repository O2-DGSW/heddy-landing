import type { Range } from "@/shared/lib/motion";

/** 폰 목업 치수 (`docs/design/spec.md` §2) */
export const PHONE = {
  width: 300,
  height: 615,
  /** 회전축(하단 중심) y 오프셋. 실제 pivot은 여기에 스케일(S)을 곱한다 */
  pivot: 307.5,
  frameColor: "#1C1E20",
  frameRadius: 42,
  screenInset: 10,
  screenWidth: 280,
  screenHeight: 595,
  screenRadius: 34,
  screenBackground: "#FBFBFB",
  shadow: "0 40px 70px -30px rgba(13,13,13,.45)",
} as const;

/** 폰 스테이지 레이아웃 (`docs/design/spec.md` §2) */
export const STAGE_LAYOUT = {
  desktop: {
    /** 이 너비(px) 이상이면 데스크톱 레이아웃 */
    breakpoint: 1024,
    scaleCap: 1,
    scaleHeightRatio: 0.78,
    scaleWidthDivisor: 1400,
    centerXRatio: 0.7,
    centerYOffset: 20,
    /** 좌측 카피 최대 너비(vw) */
    copyMaxWidthVw: 40,
    /** hero→archive 수렴 시 폰 A/B가 벌어지는 거리(px, 스케일 전) */
    convergeDx: 105,
  },
  mobile: {
    scaleCap: 0.62,
    scaleHeightRatio: 0.46,
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
 * 모든 스크롤 구간의 단일 출처 (`docs/design/spec.md` §2~5).
 * 값 대부분은 섹션 진행도(0~1) 기준 `Range`이며, 주석에 어떤 진행도인지 적는다.
 */
export const TIMELINE = {
  // --- 폰 A/B 자세 (§3) ---
  /** archive 진행도: hero→archive 폰 A/B 수렴 */
  heroArchiveConverge: [0, 0.72] as Range,
  /** archive 진행도: 폰 B 페이드아웃(끝나면 B=0) */
  archiveBFade: [0.72, 0.86] as Range,
  /** ar 진행도: 폰 A 재등장 y (yOffset) */
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
    /** record 진행도 p × 11 = raw. band는 p 기준 구간 */
    band: [0.06, 0.94] as Range,
  },
  report: {
    /** 막대 i: top - 0.3H + i·0.06H ~ top + 0.4L + i·0.06H (H=뷰포트, L=섹션 스크롤 길이) */
    barStartOffsetVh: -0.3,
    barStaggerVh: 0.06,
    barDurationRatioOfL: 0.4,
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
