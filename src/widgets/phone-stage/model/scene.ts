import {
  PHONE,
  STAGE_LAYOUT,
  TIMELINE,
  type SectionKey,
} from "@/shared/config";
import {
  easeInOutCubic,
  lerp,
  progressIn,
  type Range,
} from "@/shared/lib/motion";
import type { SceneFrame, SectionFrame } from "@/shared/lib/scroll";

export type PhonePose = {
  x: number;
  y: number;
  rotate: number;
  opacity: number;
  scale: number;
};

export type QrFlightPose = {
  x: number;
  y: number;
  rotate: number;
  scale: number;
  opacity: number;
  isVisible: boolean;
};

export type PhonesScene = {
  a: PhonePose;
  b: PhonePose;
  qrFlight: QrFlightPose;
};

export type PhoneAScreenKey =
  | "home"
  | "record"
  | "report"
  | "recommend"
  | "ar"
  | "qrShare";
export type PhoneBScreenKey = "ar" | "scan" | "webview";

export type ScreensScene = {
  a: Record<PhoneAScreenKey, number>;
  b: Record<PhoneBScreenKey, number>;
  /** 폰 A가 어두운 화면(AR)을 보여주고 있어 상태바 글자를 흰색으로 둬야 하는지 */
  hasDarkScreenA: boolean;
};

const degToRad = (deg: number): number => (deg * Math.PI) / 180;

/** 섹션 프레임을 찾는다. SECTION_KEYS 전체가 항상 채워진다는 불변식을 가정한다 */
const getSection = (frame: SceneFrame, key: SectionKey): SectionFrame => {
  const section = frame.sections.find((candidate) => candidate.key === key);
  if (!section) throw new Error(`[phone-stage] section not found: ${key}`);
  return section;
};

/** V(off, deg) = [cx+off+pivot·sin(deg), cy+pivot-pivot·cos(deg)]. 회전축(pivot)은 폰 하단 중심 */
const convergePoint = (
  cx: number,
  cy: number,
  pivot: number,
  offset: number,
  degrees: number,
): { x: number; y: number } => ({
  x: cx + offset + pivot * Math.sin(degToRad(degrees)),
  y: cy + pivot - pivot * Math.cos(degToRad(degrees)),
});

/** 폰 A/B의 위치·회전·화면 전환용 자세를 계산한다 (`docs/design/spec.md` §3) */
export const computePhones = (frame: SceneFrame): PhonesScene => {
  const { layout } = frame;
  const scale = layout.scale;
  const { x: cx, y: cy } = layout.center;
  const pivot = PHONE.pivot * scale;
  const tilt = STAGE_LAYOUT.heroTilt;
  const convergeDx =
    (layout.isMobile
      ? STAGE_LAYOUT.mobile.convergeDx
      : STAGE_LAYOUT.desktop.convergeDx) * scale;

  const pArchive = frame.progress("archive");
  const converge = easeInOutCubic(
    progressIn(pArchive, TIMELINE.heroArchiveConverge),
  );
  const remaining = 1 - converge;

  const aPoint = convergePoint(
    cx,
    cy,
    pivot,
    -convergeDx * remaining,
    -tilt * remaining,
  );
  const bPoint = convergePoint(
    cx,
    cy,
    pivot,
    convergeDx * remaining,
    tilt * remaining,
  );
  const bFadeOpacity = 1 - progressIn(pArchive, TIMELINE.archiveBFade);

  let a: PhonePose = {
    x: aPoint.x,
    y: aPoint.y,
    rotate: -tilt * remaining,
    opacity: 1,
    scale,
  };
  let b: PhonePose = {
    x: bPoint.x,
    y: bPoint.y,
    rotate: tilt * remaining,
    opacity: bFadeOpacity,
    scale,
  };

  const arSection = getSection(frame, "ar");
  const shareSection = getSection(frame, "share");
  const closingSection = getSection(frame, "closing");

  const isPastArStart = frame.scrollY >= arSection.top;
  const isPastShareStart = frame.scrollY >= shareSection.top;

  // ar: 폰 A 재등장. TODO(docs/plans/0001): recommend 끝~ar 시작 사이의 스크롤 이탈 연출은 후속 작업.
  if (isPastArStart) {
    const pAr = frame.progress("ar");
    const arReappear = easeInOutCubic(progressIn(pAr, TIMELINE.arReappearY));
    const arYOffset = (1 - arReappear) * 90 * scale;
    const arOpacity = progressIn(pAr, TIMELINE.arReappearOpacity);
    a = { x: cx, y: cy + arYOffset, rotate: 0, scale, opacity: arOpacity };
    b = { ...b, opacity: 0 };
  }

  // share: 폰 A/B가 미용실 나란히 배치로 이동
  if (isPastShareStart) {
    const pShare = frame.progress("share");
    const sh = easeInOutCubic(progressIn(pShare, TIMELINE.shareXShift));
    const back = easeInOutCubic(
      progressIn(frame.scrollY, [shareSection.end, closingSection.top]),
    );

    const viewportWidth = layout.viewportWidth;
    const aTargetX = layout.isMobile
      ? viewportWidth * 0.29
      : cx - 0.13 * viewportWidth;
    const bRestX = viewportWidth + 220 * scale;
    const bTargetX = layout.isMobile
      ? viewportWidth * 0.73
      : cx + 0.13 * viewportWidth;

    const aX = lerp(lerp(cx, aTargetX, sh), cx, back);
    const bX = lerp(lerp(bRestX, bTargetX, sh), bRestX, back);
    const bRotate = lerp(lerp(10, 0, sh), 10, back);
    const isBVisible = sh > 0 && back < 1;

    a = { x: aX, y: cy, rotate: 0, scale, opacity: 1 };
    b = { x: bX, y: cy, rotate: bRotate, scale, opacity: isBVisible ? 1 : 0 };
  }

  const qrFlight = computeQrFlight(frame, a, b, scale);

  return { a, b, qrFlight };
};

/** QR 비행: A 화면 위(y-57.5S)에서 B 화면 위(y-17.5S)로 포물선을 그리며 이동한다 (§3, §5 share) */
const computeQrFlight = (
  frame: SceneFrame,
  a: PhonePose,
  b: PhonePose,
  scale: number,
): QrFlightPose => {
  const f = progressIn(frame.progress("share"), TIMELINE.qrFlight);
  const isVisible = f > 0 && f < 1;

  const start = { x: a.x, y: a.y - 57.5 * scale };
  const end = { x: b.x, y: b.y - 17.5 * scale };
  const arcHeight = 200 * scale * 4 * f * (1 - f);

  const x = lerp(start.x, end.x, f);
  const y = lerp(start.y, end.y, f) - arcHeight;
  const rotate = -10 * Math.sin(Math.PI * f);
  const flightScale = lerp(1, 0.45, f) * scale;
  const endFade = 1 - progressIn(f, TIMELINE.qrFlightEndFade);

  return {
    x,
    y,
    rotate,
    scale: flightScale,
    opacity: isVisible ? endFade : 0,
    isVisible,
  };
};

/** 섹션 end 이후 뷰포트 높이 기준 band(기본 35~65%) 구간에서의 크로스페이드 진행도 */
const crossfadeAfter = (
  frame: SceneFrame,
  sectionEnd: number,
  band: Range = TIMELINE.screenCrossfadeBand,
): number => {
  const vh = frame.layout.viewportHeight;
  return progressIn(frame.scrollY, [
    sectionEnd + band[0] * vh,
    sectionEnd + band[1] * vh,
  ]);
};

/**
 * 폰 화면 전환(크로스페이드)을 계산한다 (`docs/design/spec.md` §4).
 * 각 화면의 opacity는 "이전 화면에서 벗어난 만큼 - 다음 화면으로 들어간 만큼"으로 구해
 * 어느 시점이든 opacity 합이 1을 넘지 않는다.
 */
export const computeScreens = (frame: SceneFrame): ScreensScene => {
  const archiveEnd = getSection(frame, "archive").end;
  const recordEnd = getSection(frame, "record").end;
  const reportEnd = getSection(frame, "report").end;
  const recommendEnd = getSection(frame, "recommend").end;
  const arEnd = getSection(frame, "ar").end;
  const shareEnd = getSection(frame, "share").end;
  const arSection = getSection(frame, "ar");

  const t0 = crossfadeAfter(frame, archiveEnd); // home -> record
  const t1 = crossfadeAfter(frame, recordEnd); // record -> report
  const t2 = crossfadeAfter(frame, reportEnd); // report -> recommend
  const t3 = crossfadeAfter(frame, recommendEnd); // recommend -> ar
  const t4 = crossfadeAfter(frame, arEnd); // ar -> qrShare
  const t5 = crossfadeAfter(frame, shareEnd, TIMELINE.shareEndToHomeBand); // qrShare -> home(loop)

  const a: Record<PhoneAScreenKey, number> = {
    home: (1 - t0) * (1 - t5) + t5,
    record: t0 * (1 - t1),
    report: t1 * (1 - t2),
    recommend: t2 * (1 - t3),
    ar: t3 * (1 - t4),
    qrShare: t4 * (1 - t5),
  };

  const isPastArStart = frame.scrollY >= arSection.top;
  const scanToWebview = progressIn(
    frame.progress("share"),
    TIMELINE.bScanToWebview,
  );
  const b: Record<PhoneBScreenKey, number> = {
    ar: isPastArStart ? 0 : 1,
    scan: isPastArStart ? 1 - scanToWebview : 0,
    webview: isPastArStart ? scanToWebview : 0,
  };

  return { a, b, hasDarkScreenA: a.ar >= 0.5 };
};
