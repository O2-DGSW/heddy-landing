import { PHONE, PHONE_3D } from "@/shared/config";
import type { SceneFrame, StageLayout } from "@/shared/lib/scroll";

import { computeRecommendTabSwitch, type RecommendTabSwitch } from "./recommendScene";
import { computePhones, computeScreens } from "./scene";
import { computeShareScreen } from "./shareScene";
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
 * 빠진다. AR 다크 패널 구간엔 숨었다가, AR 재등장(아래에서 올라옴)부터 페이지 끝(share·closing)까지 다시
 * 3D 폰이다(`docs/plans/0008`, `0009`). CSS 폰은 reduced motion·Spline 실패 때만 쓴다.
 * 폰 위치·재등장 opacity는 CSS 폰 A와 같은 식(`computePhones`)을 쓴다.
 */
export const computeSplineHandoff = (frame: SceneFrame): SplineHandoff => {
  if (frame.isReducedMotion) return { canvasOpacity: 0, cssOpacity: 1, yOffset: 0 };

  const vh = frame.layout.viewportHeight;
  const ar = frame.sections.find((section) => section.key === "ar");
  const recommend = frame.sections.find((section) => section.key === "recommend");
  if (!ar || !recommend) return { canvasOpacity: 1, cssOpacity: 0, yOffset: 0 };

  const { a } = computePhones(frame);
  const isPastRecommendSticky = frame.scrollY > recommend.end - vh;
  const isInAr = frame.scrollY >= ar.top && frame.scrollY < ar.end;
  return {
    canvasOpacity: isInAr ? a.opacity : 1,
    cssOpacity: 0,
    // share에선 폰이 세로로는 제자리(가로 이동은 씬 안 묶음이 맡음 — `computeShareRigs`)
    yOffset: isPastRecommendSticky ? a.y - frame.layout.center.y : 0,
  };
};

export type ShareRigs = {
  /** RecordRig(폰 A) 가로 이동(씬 단위) */
  a: { x: number };
  /** 폰 B가 설 자리: A와 같은 면(z 0) 위 위치·z축 회전(도, 씬 기준 반시계) */
  b: ShareTargetB;
};

export type ShareTargetB = { x: number; y: number; rotateZDeg: number; isVisible: boolean };

/**
 * share 섹션 폰 두 대 3D 배치(`docs/plans/0009`): CSS 폰 A/B와 같은 자리(`computePhones`)를 씬 단위
 * (페이지 px ÷ S)로 옮긴다. A는 RecordRig를 움직이고, B는 `fitShareRigB`로 ShareRigB 변환을 구한다.
 * B가 안 보일 땐 두 묶음 다 제자리라 히어로 합체에는 영향이 없다.
 */
export const computeShareRigs = (frame: SceneFrame): ShareRigs => {
  const { a, b } = computePhones(frame);
  const share = frame.sections.find((section) => section.key === "share");
  if (!share || frame.scrollY < share.top) {
    return { a: { x: 0 }, b: { x: 0, y: 0, rotateZDeg: 0, isVisible: false } };
  }
  const { scale, center, viewportWidth, viewportHeight } = frame.layout;
  // 퇴장 끝(share.end)은 레이아웃 반올림으로 최대 스크롤보다 1px 뒤일 수 있다 — 다 빠진 B는 숨겨 그림자를 없앤다.
  // 들어올 때는 밖에서부터 보여 그림자가 먼저 들어온다
  const isLeaving = frame.scrollY > share.end - viewportHeight;
  const isOffRight = b.x - (PHONE.width / 2) * b.scale >= viewportWidth;
  const isBVisible = b.opacity > 0 && !(isLeaving && isOffRight);
  return {
    a: { x: (a.x - center.x) / scale },
    b: isBVisible
      ? {
          x: (b.x - center.x) / scale,
          y: -(b.y - center.y) / scale,
          rotateZDeg: -b.rotate,
          isVisible: true,
        }
      : { x: 0, y: 0, rotateZDeg: 0, isVisible: false },
  };
};

export type PhoneLocal = { x: number; y: number; z: number; scale: number };
export type RigTransform = { x: number; y: number; z: number; rotateZDeg: number; scale: number };

/** PhoneB 크기가 0에 가까울 때 묶음 배율이 무한대로 튀지 않게 막는 바닥값 */
const MIN_PHONE_SCALE = 1e-3;

/**
 * ShareRigB 변환: 묶음 안 PhoneB를 목표 자리에 A와 같은 크기로 세운다.
 * PhoneB 자체는 히어로 합체 끝 "Gone" 상태(A 뒤 z −40, 크기 1%)이고 Spline Scroll 이벤트가 계속 다시 써서
 * 런타임에서 못 바꾼다. 그래서 지금 PhoneB 로컬 자세(`local`)를 읽어 묶음 배율·위치로 되돌린다.
 */
export const fitShareRigB = (target: ShareTargetB, local: PhoneLocal, phoneScale: number): RigTransform => {
  if (!target.isVisible) return { x: 0, y: 0, z: 0, rotateZDeg: 0, scale: 1 };
  const scale = phoneScale / Math.max(local.scale, MIN_PHONE_SCALE);
  const t = target.rotateZDeg * (Math.PI / 180);
  const lx = local.x * scale;
  const ly = local.y * scale;
  return {
    x: target.x - (lx * Math.cos(t) - ly * Math.sin(t)),
    y: target.y - (lx * Math.sin(t) + ly * Math.cos(t)),
    z: -local.z * scale,
    rotateZDeg: target.rotateZDeg,
    scale,
  };
};

export type ScreenOverlay = {
  /** 캔버스 중심의 페이지 좌표(카메라 축) */
  x: number;
  y: number;
  /** 폰 묶음의 씬 안 이동(씬 단위, y 위로) — 원근 안쪽에서 옮겨야 3D 폰과 겹친다 */
  sceneX: number;
  sceneY: number;
  /** 화면 면 안의 회전(도, CSS 시계 방향) */
  rotateZDeg: number;
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
  /** AR → 기록 공유 화면 크로스페이드(0~1, `docs/plans/0009`) */
  shareIn: number;
  /** 기록 공유 → 홈 화면 크로스페이드(share 끝 이후, CSS 폰과 같은 밴드) */
  homeIn: number;
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
    sceneX: computeShareRigs(frame).a.x,
    sceneY: 0,
    rotateZDeg: 0,
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
    shareIn: computeShareScreen(frame, PHONE_3D.screen).enter,
    homeIn: computeScreens(frame).a.home * (frame.scrollY > (ar?.end ?? Infinity) ? 1 : 0),
  };
};

export type ScreenOverlayB = Pick<
  ScreenOverlay,
  | "x"
  | "y"
  | "sceneX"
  | "sceneY"
  | "rotateZDeg"
  | "scale"
  | "perspective"
  | "rotateXDeg"
  | "translateZ"
  | "opacity"
>;

/** 폰 B 화면 오버레이(스캔 → 공유된 시술기록) — B 묶음과 같은 씬 위치·기울기로 투영한다(`docs/plans/0009`) */
export const computeScreenOverlayB = (frame: SceneFrame): ScreenOverlayB => {
  const { layout } = frame;
  const { b } = computeShareRigs(frame);
  const { canvasOpacity } = computeSplineHandoff(frame);
  return {
    x: layout.center.x,
    y: layout.center.y,
    sceneX: b.x,
    sceneY: b.y,
    rotateZDeg: -b.rotateZDeg,
    scale: layout.scale,
    perspective: PHONE_3D.camera.distance,
    rotateXDeg: PHONE_3D.screen.tiltDeg,
    translateZ: PHONE_3D.screen.z,
    opacity: b.isVisible ? canvasOpacity : 0,
  };
};
