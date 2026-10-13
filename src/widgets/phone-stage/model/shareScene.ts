import { SHARE_SCREEN, TIMELINE } from "@/shared/config";
import { easeInOutCubic, progressIn, type Range } from "@/shared/lib/motion";
import type { SceneFrame } from "@/shared/lib/scroll";

type ScreenSize = { width: number; height: number };

export type ShareTap = {
  /** 터치 표시 중심(화면 좌상단 기준 피그마 px) */
  x: number;
  y: number;
  /** 눌린 정도(0 → 1 → 0) */
  press: number;
  /** 물결 진행도(0이면 없음) */
  ripple: number;
};

export type ShareScreenScene = {
  /** AR → 기록 공유 화면 크로스페이드(0~1) */
  enter: number;
  /** 토글 3개(시술 내용 · 만족도 · AR 후보) 손잡이 위치(0 = 꺼짐, 1 = 켜짐) */
  toggles: [number, number, number];
  tap: ShareTap;
  /** 버튼이 드러나도록 본문이 올라간 거리(피그마 px) */
  scrollPx: number;
  /** "공유 링크 생성" 버튼이 눌린 정도(0 → 1 → 0) */
  linkPress: number;
  /** QR 화면: 배경(다운펌 상세 + 어두운 막) 크로스페이드, 모달이 뜬 정도 */
  qr: { bg: number; modal: number };
};

const NO_TAP: ShareTap = { x: 0, y: 0, press: 0, ripple: 0 };

const sectionEnd = (frame: SceneFrame, key: "ar" | "share"): number =>
  frame.sections.find((section) => section.key === key)?.end ?? 0;

const toggleRange = (index: number): Range => {
  const { start, stagger, duration } = TIMELINE.share.toggleTap;
  return [start + index * stagger, start + index * stagger + duration];
};

/** 누르는 구간 진행도 t의 눌림·물결(구간 밖이면 0) */
const pressOf = (t: number): { press: number; ripple: number } =>
  t > 0 && t < 1 ? { press: Math.sin(Math.PI * t), ripple: t } : { press: 0, ripple: 0 };

/** 버튼 아랫변이 탭바 위 여백에 닿도록 본문이 올라가야 하는 거리(피그마 px) */
export const shareButtonsScrollPx = (screen: ScreenSize): number => {
  const { designWidth, fixedTop, tabBar, buttons, buttonsMargin } = SHARE_SCREEN;
  const designHeight = (screen.height / screen.width) * designWidth;
  const buttonsBottom = fixedTop + buttons.top + buttons.height;
  return Math.max(0, buttonsBottom + buttonsMargin - (designHeight - tabBar));
};

/**
 * 폰 A 공유 화면(레퍼런스 영상 1, `docs/plans/0009`): 토글을 하나씩 눌러 켜고 → 화면이 내려가 버튼이 드러나고
 * → "공유 링크 생성"을 누르면 → 다운펌 상세가 어두워지며 QR 모달이 뜬다.
 */
export const computeShareScreen = (frame: SceneFrame, screen: ScreenSize): ShareScreenScene => {
  const vh = frame.layout.viewportHeight;
  const arEnd = sectionEnd(frame, "ar");
  const [from, to] = TIMELINE.share.fromArBand;
  const enter = progressIn(frame.scrollY, [arEnd + from * vh, arEnd + to * vh]);
  const p = frame.progress("share");
  const share = TIMELINE.share;

  if (frame.isReducedMotion) {
    return {
      enter,
      toggles: [1, 1, 1],
      tap: NO_TAP,
      scrollPx: shareButtonsScrollPx(screen),
      linkPress: 0,
      qr: { bg: 1, modal: 1 },
    };
  }

  const tapProgress = SHARE_SCREEN.toggledRows.map((_, i) => progressIn(p, toggleRange(i)));
  const toggles = tapProgress.map((t) => easeInOutCubic(progressIn(t, share.toggleKnob))) as [
    number,
    number,
    number,
  ];
  const scrollPx = easeInOutCubic(progressIn(p, share.buttonsReveal)) * shareButtonsScrollPx(screen);

  // 지금 누르는 대상: 토글 하나 또는 공유 링크 생성 버튼
  let tap = NO_TAP;
  tapProgress.forEach((t, i) => {
    const pressed = pressOf(t);
    if (pressed.press > 0) {
      const row = SHARE_SCREEN.toggledRows[i];
      tap = {
        x: SHARE_SCREEN.rows.toggleCenterX,
        y: SHARE_SCREEN.fixedTop + SHARE_SCREEN.rows.firstCenterY + row * SHARE_SCREEN.rows.pitch - scrollPx,
        ...pressed,
      };
    }
  });
  const link = pressOf(progressIn(p, share.linkTap));
  if (link.press > 0) {
    const { buttons } = SHARE_SCREEN;
    tap = {
      x: buttons.linkCenterX,
      y: SHARE_SCREEN.fixedTop + buttons.top + buttons.height / 2 - scrollPx,
      ...link,
    };
  }

  const modal = progressIn(p, share.qrModal);
  return {
    enter,
    toggles,
    tap,
    scrollPx,
    linkPress: link.press,
    qr: { bg: progressIn(modal, [0, 0.5]), modal: easeInOutCubic(modal) },
  };
};

/** 폰 B: QR이 도착하면 공유된 시술기록이 열리고, 체크 표시가 커지며 떴다가 사라진다 */
export const computeShareB = (
  frame: SceneFrame,
): { webview: number; check: { opacity: number; scale: number } } => {
  const p = frame.progress("share");
  const webview = progressIn(p, TIMELINE.bScanToWebview);
  if (frame.isReducedMotion) return { webview: webview > 0 ? 1 : 0, check: { opacity: 0, scale: 1 } };
  const checkIn = easeInOutCubic(progressIn(p, TIMELINE.share.checkIn));
  const checkOut = progressIn(p, TIMELINE.share.checkOut);
  return { webview, check: { opacity: checkIn * (1 - checkOut), scale: 0.6 + 0.4 * checkIn } };
};
