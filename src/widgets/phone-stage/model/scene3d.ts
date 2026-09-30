import { PHONE_3D, TIMELINE } from "@/shared/config";
import { easeInOutCubic, lerp, progressIn } from "@/shared/lib/motion";
import type { SceneFrame, StageLayout } from "@/shared/lib/scroll";

/** 스테이지 로컬 좌표(원점 = CSS 폰 A 중심, 스케일 1의 px) 기준 3D 자세. 회전은 도 */
export type Pose3D = {
  x: number;
  y: number;
  z: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  isVisible: boolean;
};

/** 로컬 좌표 → Spline 월드 좌표 환산: world = offset + k·local */
export type Stage3D = {
  x: number;
  y: number;
  k: number;
  /** 월드 1단위가 z=0 평면에서 차지하는 화면 px */
  pixelsPerUnit: number;
};

export type Phones3DScene = {
  a: Pose3D;
  b: Pose3D;
  stage: Stage3D;
  /** 3D 캔버스 opacity (1→0이 되면 CSS 폰으로 넘어감) */
  canvasOpacity: number;
  /** CSS 폰 A/B에 곱할 opacity */
  cssOpacity: number;
};

type Pose = Omit<Pose3D, "isVisible">;

const lerpPose = (from: Pose, to: Pose, t: number): Pose => ({
  x: lerp(from.x, to.x, t),
  y: lerp(from.y, to.y, t),
  z: lerp(from.z, to.z, t),
  rotX: lerp(from.rotX, to.rotX, t),
  rotY: lerp(from.rotY, to.rotY, t),
  rotZ: lerp(from.rotZ, to.rotZ, t),
});

/** 카메라 시야각과 뷰포트 높이로 CSS 폰 A 중심·스케일에 맞는 월드 환산값을 구한다 */
export const computeStage3D = (layout: StageLayout): Stage3D => {
  const { fovDeg, distance } = PHONE_3D.camera;
  const visibleHeight = 2 * distance * Math.tan(((fovDeg / 2) * Math.PI) / 180);
  const pixelsPerUnit = layout.viewportHeight / visibleHeight;
  return {
    x: (layout.center.x - layout.viewportWidth / 2) / pixelsPerUnit,
    y: -(layout.center.y - layout.viewportHeight / 2) / pixelsPerUnit,
    k: layout.scale / pixelsPerUnit,
    pixelsPerUnit,
  };
};

/** 스테이지 로컬 점(z=0)이 화면 어디에 보이는지 (검증·디버그용) */
export const projectToScreen = (
  stage: Stage3D,
  localX: number,
  localY: number,
  layout: StageLayout,
): { x: number; y: number } => ({
  x: layout.viewportWidth / 2 + (stage.x + stage.k * localX) * stage.pixelsPerUnit,
  y: layout.viewportHeight / 2 - (stage.y + stage.k * localY) * stage.pixelsPerUnit,
});

/**
 * hero→archive 3D 합체. A는 수렴 구간 동안 세 축을 함께 정면으로, B는 조금 늦게 A 바로 뒤로
 * 모여 가려진 뒤 숨는다. 합쳐진 자세가 CSS 폰 A와 같아서 `splineHandoff`에서 크로스페이드한다.
 */
export const computePhones3D = (frame: SceneFrame): Phones3DScene => {
  const stage = computeStage3D(frame.layout);
  const pArchive = frame.progress("archive");

  const raw = progressIn(pArchive, TIMELINE.heroArchiveConverge);
  const tA = easeInOutCubic(raw);
  const tB = easeInOutCubic(progressIn(raw, [PHONE_3D.bLag, 1]));

  const mergedB: Pose = { ...PHONE_3D.mergedA, z: PHONE_3D.mergedBBehindZ };
  const a = lerpPose(PHONE_3D.heroStart.a, PHONE_3D.mergedA, tA);
  const b = lerpPose(PHONE_3D.heroStart.b, mergedB, tB);

  const handoff = progressIn(pArchive, TIMELINE.splineHandoff);
  const canvasOpacity = frame.isReducedMotion ? 0 : 1 - handoff;

  return {
    a: { ...a, isVisible: canvasOpacity > 0 },
    b: { ...b, isVisible: canvasOpacity > 0 },
    stage,
    canvasOpacity,
    cssOpacity: 1 - canvasOpacity,
  };
};
