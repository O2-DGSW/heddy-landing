import { PHONE_3D } from "@/shared/config";
import { progressIn } from "@/shared/lib/motion";
import type { SceneFrame, StageLayout } from "@/shared/lib/scroll";

import { computeRecommendTabSwitch, type RecommendTabSwitch } from "./recommendScene";
import { computePhones } from "./scene";
import { computeTapToDetail } from "./tapToDetail";

export type SplineViewport = { left: number; top: number; width: number; height: number };

export type SplineHandoff = {
  /** 3D 캔버스 opacity (1→0이 되면 CSS 폰으로 넘어감) */
  canvasOpacity: number;
  /** CSS 폰 A/B에 곱할 opacity */
  cssOpacity: number;
  /** 3D 폰(캔버스·화면 오버레이)을 세로로 옮길 양(px) — 추천 끝에서 위로 빠지고 AR에서 아래에서 올라온다 */
  yOffset: number;
};

/** 캔버스 가로:세로. 히어로의 두 폰과 그림자가 잘리지 않을 만큼 넓게 */
const CANVAS_ASPECT = 1.6;

/**
 * Spline 캔버스 위치·크기. 씬 카메라가 월드 원점(합쳐진 PhoneA)을 캔버스 중심에 비추므로,
 * 캔버스 중심을 CSS 폰 A 중심에 두고 높이 615가 615·scale px로 보이게 캔버스 높이를 정한다.
 */
export const computeSplineViewport = (layout: StageLayout): SplineViewport => {
  const { fovDeg, distance } = PHONE_3D.camera;
  const visibleHeight = 2 * distance * Math.tan(((fovDeg / 2) * Math.PI) / 180);
  const height = visibleHeight * layout.scale;
  const width = height * CANVAS_ASPECT;
  return {
    left: layout.center.x - width / 2,
    top: layout.center.y - height / 2,
    width,
    height,
  };
};

/**
 * hero부터 recommend 섹션 끝까지 3D 폰으로 보여 주고, recommend 고정이 끝나면 폰이 페이지와 함께 위로
 * 빠진다. AR 다크 패널 구간엔 숨었다가, AR 재등장(아래에서 올라옴)부터 ar 고정 끝까지 다시 3D 폰이다.
 * ar 고정이 끝나면(qrShare 화면 전환 전) CSS 폰 A로 크로스페이드한다(`docs/plans/0008`).
 * 폰 위치·재등장 opacity는 CSS 폰 A와 같은 식(`computePhones`)을 쓴다. Spline 합체(페이지 px 고정)가
 * 더 늦게 끝나면 그 뒤로 미룬다.
 */
export const computeSplineHandoff = (frame: SceneFrame): SplineHandoff => {
  if (frame.isReducedMotion) return { canvasOpacity: 0, cssOpacity: 1, yOffset: 0 };

  const vh = frame.layout.viewportHeight;
  const ar = frame.sections.find((section) => section.key === "ar");
  const recommend = frame.sections.find((section) => section.key === "recommend");
  if (!ar || !recommend) return { canvasOpacity: 1, cssOpacity: 0, yOffset: 0 };

  const arEndAt = ar.top + Math.max(ar.height - vh, 1);
  const start = Math.max(PHONE_3D.mergeEndScrollPx, arEndAt);
  const handoff = progressIn(frame.scrollY, [start, start + PHONE_3D.handoffScrollPx]);

  const { a } = computePhones(frame);
  const isPastRecommendSticky = frame.scrollY > recommend.end - vh;
  const presence = frame.scrollY >= ar.top ? a.opacity : 1;
  return {
    canvasOpacity: (1 - handoff) * presence,
    cssOpacity: handoff,
    yOffset: isPastRecommendSticky ? a.y - frame.layout.center.y : 0,
  };
};

export type ScreenOverlay = {
  /** 화면 중심의 페이지 좌표(= 캔버스 중심) */
  x: number;
  y: number;
  scale: number;
  perspective: number;
  rotateXDeg: number;
  translateZ: number;
  /** 캔버스와 함께 사라지는 오버레이 전체 opacity(탭·push 전에는 0) */
  opacity: number;
  /** 맨 위 카드가 눌린 정도(0 → 1 → 0) */
  press: number;
  /** 탭 물결 진행도(0이면 없음) */
  ripple: number;
  /** 상세 화면이 오른쪽에서 들어온 정도(0~1) */
  push: number;
  /** 상세 → 추천 화면: 추천 탭 탭 + 옆으로 밀기(`docs/plans/0007`) */
  tabSwitch: RecommendTabSwitch;
  /** ar 섹션에 들어와 AR 화면을 보여 줄지(`docs/plans/0008`) — 그 전엔 폰이 화면 밖이라 바로 바뀐다 */
  isArScreen: boolean;
};

/**
 * 3D 폰 화면 위에 HTML 화면(리포트 상세)을 겹치는 CSS 3D 변환. 씬 카메라(정면, 거리 D, 캔버스 높이로
 * 1px = scale)와 같은 투영이 되도록 `translate(x,y) scale(S) perspective(D) rotateX(8°) translateZ(z)`를 쓴다.
 * 기록 → 상세는 크로스페이드 대신 탭 + push(`computeTapToDetail`)로 바뀐다. 오버레이 opacity는 캔버스를
 * 따라가서, 캔버스가 CSS 폰으로 넘어가면 같이 사라진다.
 */
export const computeScreenOverlay = (frame: SceneFrame): ScreenOverlay => {
  const { layout } = frame;
  const { canvasOpacity, yOffset } = computeSplineHandoff(frame);
  const ar = frame.sections.find((section) => section.key === "ar");
  const { press, ripple, push } = computeTapToDetail(frame);
  const isActive = ripple > 0 || push > 0;
  return {
    x: layout.center.x,
    y: layout.center.y + yOffset,
    scale: layout.scale,
    perspective: PHONE_3D.camera.distance,
    rotateXDeg: PHONE_3D.screen.tiltDeg,
    translateZ: PHONE_3D.screen.z,
    opacity: isActive ? canvasOpacity : 0,
    press,
    ripple,
    push,
    tabSwitch: computeRecommendTabSwitch(frame),
    isArScreen: ar ? frame.scrollY >= ar.top : false,
  };
};
