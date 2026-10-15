import { SMOOTH_SCROLL } from "@/shared/config";
import { clamp, damp } from "@/shared/lib/motion";

const LINE_HEIGHT_PX = 16;

/** 휠 delta를 px로 바꾼다(줄·페이지 단위 휠 대응) */
export const wheelDeltaPx = (
  event: Pick<WheelEvent, "deltaY" | "deltaMode">,
  viewportHeight: number,
): number => {
  if (event.deltaMode === 1) return event.deltaY * LINE_HEIGHT_PX;
  if (event.deltaMode === 2) return event.deltaY * viewportHeight;
  return event.deltaY;
};

/** 목표 스크롤 위치에 delta를 더하고 0 ~ 최대 스크롤 안으로 자른다 */
export const addScrollTarget = (target: number, delta: number, maxScroll: number): number =>
  clamp(target + delta, 0, Math.max(maxScroll, 0));

/** 한 프레임: current를 target 쪽으로 반감기만큼 따라가게 하고, 거의 다 왔으면 붙이고 멈춘다 */
export const stepSmoothScroll = (
  current: number,
  target: number,
  dtMs: number,
): { current: number; isDone: boolean } => {
  const next = damp(current, target, dtMs, SMOOTH_SCROLL.halfLifeMs);
  if (Math.abs(target - next) < SMOOTH_SCROLL.settlePx) return { current: target, isDone: true };
  return { current: next, isDone: false };
};
