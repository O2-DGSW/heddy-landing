import { PHONE_3D } from "@/shared/config";
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
 * hero부터 record 섹션(기록 스택, `docs/plans/0004`) 끝까지는 3D 폰으로 보여 주고, record가
 * 끝난 뒤(report 화면 전환 전) CSS 폰 A로 크로스페이드한다. 그 시점엔 RecordRig가 정면으로
 * 돌아와 있어 이음새가 없다. Spline 합체(페이지 px 고정)가 더 늦게 끝나면 그 뒤로 미룬다.
 */
export const computeSplineHandoff = (frame: SceneFrame): SplineHandoff => {
  if (frame.isReducedMotion) return { canvasOpacity: 0, cssOpacity: 1 };

  const record = frame.sections.find((section) => section.key === "record");
  const recordEndAt = record ? record.top + Math.max(record.height - frame.layout.viewportHeight, 1) : 0;
  const start = Math.max(PHONE_3D.mergeEndScrollPx, recordEndAt);
  const handoff = progressIn(frame.scrollY, [start, start + PHONE_3D.handoffScrollPx]);
  const canvasOpacity = 1 - handoff;
  return { canvasOpacity, cssOpacity: handoff };
};
