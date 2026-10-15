import { CLOSING_PHONE, PHONE, PHONE_3D, SHARE_SCREEN, TIMELINE, type SectionKey } from "@/shared/config";
import { easeInOutCubic, lerp, progressIn, type Range } from "@/shared/lib/motion";
import type { SceneFrame, SectionFrame, StageLayout } from "@/shared/lib/scroll";

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

/** `home`은 히어로 홈(실제 앱 스크린샷), `closingHome`은 마지막 섹션 홈(`docs/plans/0010`) — 서로 다른 화면이다 */
export type PhoneAScreenKey = "home" | "record" | "report" | "recommend" | "ar" | "qrShare" | "closingHome";
export type PhoneBScreenKey = "ar" | "scan" | "webview";

export type ScreensScene = {
  a: Record<PhoneAScreenKey, number>;
  b: Record<PhoneBScreenKey, number>;
  /** 폰 A가 어두운 화면(AR)을 보여주고 있어 상태바 글자를 흰색으로 둬야 하는지 */
  hasDarkScreenA: boolean;
};

/** 섹션 프레임을 찾는다. SECTION_KEYS 전체가 항상 채워진다는 불변식을 가정한다 */
const getSection = (frame: SceneFrame, key: SectionKey): SectionFrame => {
  const section = frame.sections.find((candidate) => candidate.key === key);
  if (!section) throw new Error(`[phone-stage] section not found: ${key}`);
  return section;
};

/**
 * 3D 폰 레이어 보임(0~1, 이슈 #71): 인트로를 보는 동안엔 숨기고, record 직전(폰이 회전하며 기울기 시작할 무렵)에
 * 나타난다. 그 전에 Spline 합체(페이지 스크롤 `PHONE_3D.mergeEndScrollPx`까지)가 숨은 채 끝난다.
 */
export const computeStageReveal = (frame: SceneFrame): number => {
  const record = getSection(frame, "record");
  const vh = frame.layout.viewportHeight;
  return progressIn(frame.scrollY, [
    record.top + TIMELINE.stageRevealVh[0] * vh,
    record.top + TIMELINE.stageRevealVh[1] * vh,
  ]);
};

/** 폰 A/B의 위치·회전·화면 전환용 자세를 계산한다 (`docs/design/spec.md` §3) */
export const computePhones = (frame: SceneFrame): PhonesScene => {
  const { layout } = frame;
  const scale = layout.scale;
  const { x: cx, y: cy } = layout.center;

  // 인트로~record: 합쳐진 폰 A 한 대가 스테이지 가운데 정면에 선다(히어로 V자·합체는 인트로 뒤에서 숨은 채 끝남)
  let a: PhonePose = { x: cx, y: cy, rotate: 0, opacity: 1, scale };
  let b: PhonePose = { x: cx, y: cy, rotate: 0, opacity: 0, scale };

  const arSection = getSection(frame, "ar");
  const shareSection = getSection(frame, "share");
  const closingSection = getSection(frame, "closing");

  const isPastArStart = frame.scrollY >= arSection.top;
  const isPastShareStart = frame.scrollY >= shareSection.top;

  // recommend 고정 끝 ~ ar 시작: A가 페이지와 함께 위로 빠진다(spec §3, `docs/plans/0008`)
  const recommendStickyEnd = getSection(frame, "recommend").end - layout.viewportHeight;
  if (frame.scrollY > recommendStickyEnd && !isPastArStart) {
    a = { x: cx, y: cy - (frame.scrollY - recommendStickyEnd), rotate: 0, scale, opacity: 1 };
    b = { ...b, opacity: 0 };
  }

  // ar: 폰 A 재등장(아래에서 올라오며 나타남)
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
    const { sh, back } = computeShareProgress(frame);

    const viewportWidth = layout.viewportWidth;
    // 모바일은 두 대가 화면 폭에 나란히 — 원본 0.29W는 가운데서 겹침
    const aTargetX = layout.isMobile ? viewportWidth * 0.27 : cx - 0.13 * viewportWidth;
    const bRestX = viewportWidth + 220 * scale;
    const bTargetX = layout.isMobile ? viewportWidth * 0.73 : cx + 0.13 * viewportWidth;
    const closing = computeClosingPose(layout);

    const aX = lerp(lerp(cx, aTargetX, sh), closing.x, back);
    const bX = lerp(lerp(bRestX, bTargetX, sh), bRestX, back);
    const bRotate = lerp(lerp(10, 0, sh), 10, back);
    const isBVisible = sh > 0 && back < 1;
    // closing 아래 푸터가 올라오면 폰이 위로 잘려 나가지 않게, 푸터 위 남은 높이에 맞춰 같은 비율로 줄인다(팀 피드백)
    const footerScroll = Math.max(0, frame.scrollY - closingSection.top);
    const fit = layout.isMobile
      ? 1
      : Math.max(0, layout.viewportHeight - footerScroll) / layout.viewportHeight;

    a = {
      x: aX,
      y: layout.isMobile ? lerp(cy, closing.y, back) - footerScroll : lerp(cy, closing.y, back) * fit,
      rotate: 0,
      scale: lerp(scale, closing.scale, back) * fit,
      opacity: 1,
    };
    b = { x: bX, y: cy, rotate: bRotate, scale, opacity: isBVisible ? 1 : 0 };
  }

  const qrFlight = computeQrFlight(frame, a, b, scale);

  return { a, b, qrFlight };
};

/** share 진행도: sh = 나란히 서기, back = share 고정 끝 ~ share.end에 B가 빠지고 A가 closing 자리로 */
const computeShareProgress = (frame: SceneFrame): { sh: number; back: number } => {
  const shareSection = getSection(frame, "share");
  const closingSection = getSection(frame, "closing");
  const sh = easeInOutCubic(progressIn(frame.progress("share"), TIMELINE.shareXShift));
  // 원본은 share.end~closing.top(길이 0이라 순간 이동)
  const shareStickyEnd = shareSection.end - frame.layout.viewportHeight;
  const back = easeInOutCubic(
    progressIn(frame.scrollY, [shareStickyEnd, Math.max(shareSection.end, closingSection.top)]),
  );
  return { sh, back };
};

/**
 * closing 폰 A 자세(`docs/plans/0010`): 데스크톱은 오른쪽(0.78W, 0.5H)에 화면 높이 80%로 선다. 좁은 화면에선
 * 오른쪽 여백 안에 들어오게 줄이되, 원래 크기(S)보다 작아지지는 않는다. 모바일은 스테이지 가운데·원래 크기.
 */
const computeClosingPose = (layout: StageLayout): { x: number; y: number; scale: number } => {
  const { scale, center, viewportWidth, viewportHeight } = layout;
  if (layout.isMobile) return { x: center.x, y: center.y, scale };
  const { centerXRatio, centerYRatio, heightRatio, edgeMarginPx } = CLOSING_PHONE;
  const x = centerXRatio * viewportWidth;
  const byHeight = (heightRatio * viewportHeight) / PHONE.height;
  const byWidth = (viewportWidth - edgeMarginPx - x) / (PHONE.width / 2);
  return { x, y: centerYRatio * viewportHeight, scale: Math.max(scale, Math.min(byHeight, byWidth)) };
};

/**
 * QR 비행: A 화면 QR 모달 속 QR 자리에서 B 스캔 틀 가운데로 포물선을 그리며 이동한다(§3, §5 share,
 * `docs/plans/0009`). 화면 속 위치는 피그마 px → 씬 단위(3D 폰 화면 폭 기준) → 페이지 px(S)로 옮긴다.
 */
const computeQrFlight = (frame: SceneFrame, a: PhonePose, b: PhonePose, scale: number): QrFlightPose => {
  const f = progressIn(frame.progress("share"), TIMELINE.qrFlight);
  const isVisible = f > 0 && f < 1;

  const { designWidth, qrModal, scanFrame } = SHARE_SCREEN;
  // 폰마다 크기가 다를 수 있다(모바일 확대) — 출발은 A, 도착은 B 크기로
  const designToPage = (PHONE_3D.screen.width / designWidth) * scale;
  const designToPageA = designToPage * (a.scale / scale);
  const designToPageB = designToPage * (b.scale / scale);
  const designHeight = (PHONE_3D.screen.height / PHONE_3D.screen.width) * designWidth;
  const start = { x: a.x, y: a.y + qrModal.qrOffsetY * designToPageA };
  const end = { x: b.x, y: b.y + (scanFrame.centerYRatio - 0.5) * designHeight * designToPageB };
  const arcHeight = 200 * scale * 4 * f * (1 - f);

  const x = lerp(start.x, end.x, f);
  const y = lerp(start.y, end.y, f) - arcHeight;
  const rotate = -10 * Math.sin(Math.PI * f);
  // 모달 속 QR 크기에서 스캔 틀 크기로(기준 크기 S 대비)
  const flightScale = lerp(a.scale / scale, (scanFrame.size / qrModal.qrSize) * (b.scale / scale), f);
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
  return progressIn(frame.scrollY, [sectionEnd + band[0] * vh, sectionEnd + band[1] * vh]);
};

/**
 * 폰 화면 전환(크로스페이드)을 계산한다 (`docs/design/spec.md` §4).
 * 각 화면의 opacity는 "이전 화면에서 벗어난 만큼 - 다음 화면으로 들어간 만큼"으로 구해
 * 어느 시점이든 opacity 합이 1을 넘지 않는다.
 */
export const computeScreens = (frame: SceneFrame): ScreensScene => {
  const recordTop = getSection(frame, "record").top;
  const recordEnd = getSection(frame, "record").end;
  const reportEnd = getSection(frame, "report").end;
  const recommendEnd = getSection(frame, "recommend").end;
  const arEnd = getSection(frame, "ar").end;
  const shareEnd = getSection(frame, "share").end;
  const arSection = getSection(frame, "ar");

  const t0 = crossfadeAfter(frame, recordTop); // home -> record(record 시작 기준, 예전 archive 끝과 같은 자리)
  const t1 = crossfadeAfter(frame, recordEnd, TIMELINE.report.fromRecordBand); // record -> report(상세)
  const t2 = crossfadeAfter(frame, reportEnd, TIMELINE.recommend.tabSlideBand); // report -> recommend(3D 오버레이의 밀기와 같은 밴드)
  const t3 = crossfadeAfter(frame, recommendEnd); // recommend -> ar
  const t4 = crossfadeAfter(frame, arEnd, TIMELINE.share.fromArBand); // ar -> 기록 공유(3D 오버레이와 같은 밴드)
  // qrShare -> closing 홈: share 고정 끝 기준(폰이 closing 자리로 가는 동안)
  const t5 = crossfadeAfter(frame, shareEnd - frame.layout.viewportHeight, TIMELINE.share.toClosingHomeBand);

  const a: Record<PhoneAScreenKey, number> = {
    home: 1 - t0,
    record: t0 * (1 - t1),
    report: t1 * (1 - t2),
    recommend: t2 * (1 - t3),
    ar: t3 * (1 - t4),
    qrShare: t4 * (1 - t5),
    closingHome: t5,
  };

  const isPastArStart = frame.scrollY >= arSection.top;
  const scanToWebview = progressIn(frame.progress("share"), TIMELINE.bScanToWebview);
  const b: Record<PhoneBScreenKey, number> = {
    ar: isPastArStart ? 0 : 1,
    scan: isPastArStart ? 1 - scanToWebview : 0,
    webview: isPastArStart ? scanToWebview : 0,
  };

  return { a, b, hasDarkScreenA: a.ar >= 0.5 };
};
