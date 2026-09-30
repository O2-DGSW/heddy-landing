import { PHONE_3D, TIMELINE } from "@/shared/config";
import { progressIn } from "@/shared/lib/motion";
import type { SceneFrame, StageLayout } from "@/shared/lib/scroll";

export type SplineViewport = { left: number; top: number; width: number; height: number };

export type SplineHandoff = {
  /** 3D 캔버스 opacity (1→0이 되면 CSS 폰으로 넘어감) */
  canvasOpacity: number;
  /** CSS 폰 A/B에 곱할 opacity */
  cssOpacity: number;
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
 * Spline 합체(페이지 px 고정)와 CSS 폰 합체(archive 진행도, 뷰포트 비례) 중 늦게 끝나는 쪽 이후에
 * 크로스페이드한다 — 둘 다 정면에 멈춘 뒤라 화면 크기와 상관없이 이음새가 없다.
 */
export const computeSplineHandoff = (frame: SceneFrame): SplineHandoff => {
  if (frame.isReducedMotion) return { canvasOpacity: 0, cssOpacity: 1 };

  const archive = frame.sections.find((section) => section.key === "archive");
  const [, cssMergeEnd] = TIMELINE.heroArchiveConverge;
  const cssMergedAt = archive
    ? archive.top + cssMergeEnd * Math.max(archive.height - frame.layout.viewportHeight, 1)
    : 0;
  const start = Math.max(PHONE_3D.mergeEndScrollPx, cssMergedAt);
  const handoff = progressIn(frame.scrollY, [start, start + PHONE_3D.handoffScrollPx]);
  const canvasOpacity = 1 - handoff;
  return { canvasOpacity, cssOpacity: handoff };
};
