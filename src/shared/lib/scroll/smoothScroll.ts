import { SCROLL_STOP, SMOOTH_SCROLL, type SectionKey } from "@/shared/config";
import { clamp, damp } from "@/shared/lib/motion";

import type { SectionFrame } from "./stageLayout";

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

/**
 * from → to로 갈 때 지나는 첫 멈춤 지점(팀 피드백 2026-10-14). 출발 지점은 빼고 도착 지점은 넣는다 —
 * 멈춤 지점에 서 있다가 다시 굴리면 그 지점에 또 걸리지 않는다. stops는 오름차순.
 */
export const firstStopCrossed = (from: number, to: number, stops: readonly number[]): number | null => {
  if (to > from) return stops.find((stop) => stop > from && stop <= to) ?? null;
  if (to < from) {
    for (let i = stops.length - 1; i >= 0; i -= 1) {
      if (stops[i] < from && stops[i] >= to) return stops[i];
    }
  }
  return null;
};

/** [섹션, 진행도] 멈춤 지점을 페이지 px로 바꾼다(오름차순). 숨은 섹션(높이 0, 모바일)은 뺀다 */
export const scrollStopsPx = (
  points: ReadonlyArray<readonly [SectionKey, number]>,
  sections: readonly SectionFrame[],
  viewportHeight: number,
): number[] =>
  points
    .flatMap(([key, p]) => {
      const section = sections.find((candidate) => candidate.key === key);
      if (!section || section.height <= 0) return [];
      return [section.top + p * Math.max(section.height - viewportHeight, 0)];
    })
    .sort((a, b) => a - b);

export type StopHold = {
  now: number;
  /** 멈춤 지점에 닿은 시각(아직이면 null) */
  arrivedAt: number | null;
  lastWheelAt: number;
  /** 멈춘 동안 흡수한 휠 양(px, 절댓값 합) */
  absorbedPx: number;
};

/** 멈춘 뒤 풀리는가: 닿고 minHoldMs가 지났고 휠이 quietMs 조용했거나, maxHoldMs가 지났거나, 흡수한 휠이 많으면 */
export const isStopReleased = (hold: StopHold, viewportHeight: number): boolean => {
  if (hold.arrivedAt == null) return false;
  if (hold.absorbedPx > SCROLL_STOP.maxAbsorbOfViewport * viewportHeight) return true;
  if (hold.now - hold.arrivedAt >= SCROLL_STOP.maxHoldMs) return true;
  return (
    hold.now - hold.arrivedAt >= SCROLL_STOP.minHoldMs && hold.now - hold.lastWheelAt >= SCROLL_STOP.quietMs
  );
};
