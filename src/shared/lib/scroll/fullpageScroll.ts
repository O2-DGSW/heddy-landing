import { FULLPAGE, type SectionKey } from "@/shared/config";
import { clamp, cubicBezier, easeInOutSine, easePlateau, lerp } from "@/shared/lib/motion";

import type { SectionFrame } from "./stageLayout";

export type FullpageStop = {
  key: SectionKey | "footer";
  progress: number;
  scrollY: number;
};

export type FullpageWheelGesture = { lastTime: number | null; direction: number };

const POSITION_TOLERANCE_PX = 2;

/** 실제 섹션 크기로 각 완성 화면과 푸터의 위치를 계산하고 중복된 위치는 제외한다. */
export const fullpageStops = (
  sections: readonly SectionFrame[],
  viewportHeight: number,
  maxScroll: number,
): FullpageStop[] => {
  if (sections.length === 0) return [];
  const stops: FullpageStop[] = [];
  for (const [key, progress] of FULLPAGE.stops) {
    const section = sections.find((candidate) => candidate.key === key);
    if (!section) continue;
    const scrollY = clamp(
      section.top + Math.max(0, section.height - viewportHeight) * progress,
      0,
      Math.max(0, maxScroll),
    );
    if (stops.length === 0 || scrollY - stops[stops.length - 1].scrollY > POSITION_TOLERANCE_PX) {
      stops.push({ key, progress, scrollY });
    }
  }
  if (maxScroll - (stops[stops.length - 1]?.scrollY ?? 0) > POSITION_TOLERANCE_PX) {
    stops.push({ key: "footer", progress: 1, scrollY: maxScroll });
  }
  return stops;
};

/** 스크롤바로 중간에 온 경우에도 입력 방향에 있는 첫 정지 지점으로 이동한다. */
export const nextFullpageIndex = (
  stops: readonly FullpageStop[],
  scrollY: number,
  direction: number,
): number => {
  if (stops.length === 0) return -1;
  if (direction > 0) {
    const index = stops.findIndex((stop) => stop.scrollY > scrollY + POSITION_TOLERANCE_PX);
    return index < 0 ? stops.length - 1 : index;
  }
  for (let index = stops.length - 1; index >= 0; index--) {
    if (stops[index].scrollY < scrollY - POSITION_TOLERANCE_PX) return index;
  }
  return 0;
};

/** 현재 위치에서 가장 가까운 화면을 점 내비게이션의 현재 화면으로 표시한다. */
export const activeFullpageIndex = (stops: readonly FullpageStop[], scrollY: number): number => {
  let nearest = -1;
  stops.forEach((stop, index) => {
    if (nearest < 0 || Math.abs(stop.scrollY - scrollY) < Math.abs(stops[nearest].scrollY - scrollY))
      nearest = index;
  });
  return nearest;
};

export type FullpageSegmentKind = "hidden" | "leave" | "slide" | "enter" | "pass";

export type FullpageSegment = {
  kind: FullpageSegmentKind;
  from: number;
  to: number;
  durationMs: number;
  /**
   * 구간 안 속도 배분 [누적 시간 비율(0~1), scrollY] — 천천히 재생할 구간(`FULLPAGE.enter.slowRanges`)이 있으면
   * 그 구간에 시간을 더 준다. 없으면 from → to 균등
   */
  knots?: readonly (readonly [number, number])[];
};

const SLIDE_EASE = cubicBezier(...FULLPAGE.slide.bezier);
const ENTER_EASE = easePlateau(FULLPAGE.enter.ramp);
const easeOf = (kind: FullpageSegmentKind): ((t: number) => number) =>
  kind === "slide" ? SLIDE_EASE : kind === "enter" ? ENTER_EASE : easeInOutSine;

/** 화면이 멈춰 있는 sticky 범위 [top, end − 화면 높이] — 이 밖에서는 화면 전체가 움직인다 */
const stickyRanges = (sections: readonly SectionFrame[], viewportHeight: number) =>
  sections
    .filter((section) => section.height > viewportHeight)
    .map((section) => ({ key: section.key, start: section.top, end: section.end - viewportHeight }));

const slideDuration = (distance: number, viewportHeight: number): number => {
  const ratio = distance / viewportHeight;
  const { durationMs, shortMinMs } = FULLPAGE.slide;
  return ratio >= 1 ? durationMs * ratio : Math.max(shortMinMs, durationMs * Math.sqrt(ratio));
};

/**
 * 전환 한 번(from → to)을 구간으로 나눈다(이슈 #82, `docs/plans/0023`). 섹션 sticky 범위 안은 화면이 멈춘 채 모션만
 * 진행하는 구간(떠나기·도착·지나가기, 숨은 섹션은 0초), 밖은 화면 전체가 미끄러지는 구간(배민 0.9초 곡선)이다.
 * 구간은 이동 방향 순서이고 끝과 시작이 맞닿아 위치가 끊기지 않는다.
 */
export const fullpagePlan = (
  from: number,
  to: number,
  sections: readonly SectionFrame[],
  viewportHeight: number,
): FullpageSegment[] => {
  if (Math.abs(to - from) < 0.5) return [];
  const direction = Math.sign(to - from);
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  const ranges = stickyRanges(sections, viewportHeight);
  const cuts = [lo, hi, ...ranges.flatMap((range) => [range.start, range.end])]
    .filter((y) => y >= lo && y <= hi)
    .sort((a, b) => a - b)
    .filter((y, index, list) => index === 0 || y - list[index - 1] > 0.5);
  const pieces = cuts.slice(1).map((end, index) => {
    const start = cuts[index];
    const middle = (start + end) / 2;
    const range = ranges.find((candidate) => middle > candidate.start && middle < candidate.end);
    return { start, end, range };
  });
  if (direction < 0) pieces.reverse();

  return pieces.map((piece, index): FullpageSegment => {
    const [segFrom, segTo] = direction > 0 ? [piece.start, piece.end] : [piece.end, piece.start];
    const distance = piece.end - piece.start;
    const viewports = distance / viewportHeight;
    if (!piece.range)
      return { kind: "slide", from: segFrom, to: segTo, durationMs: slideDuration(distance, viewportHeight) };
    if (FULLPAGE.hiddenSections.includes(piece.range.key))
      return { kind: "hidden", from: segFrom, to: segTo, durationMs: 0 };
    const isLast = index === pieces.length - 1;
    const isFirst = index === 0;
    if (isLast) {
      const { msPerViewport, msPerViewportBySection, minMs, maxMs, slowRanges } = FULLPAGE.enter;
      const rate = msPerViewportBySection[piece.range.key] ?? msPerViewport;
      const { knots, weighted } = weightedKnots(
        segFrom,
        segTo,
        piece.range,
        slowRanges[piece.range.key] ?? [],
      );
      return {
        kind: "enter",
        from: segFrom,
        to: segTo,
        durationMs: clamp((weighted / viewportHeight) * rate, minMs, maxMs),
        knots,
      };
    }
    if (isFirst) {
      const { msPerViewport, maxMs } = FULLPAGE.leave;
      return {
        kind: "leave",
        from: segFrom,
        to: segTo,
        durationMs: Math.min(maxMs, viewports * msPerViewport),
      };
    }
    return { kind: "pass", from: segFrom, to: segTo, durationMs: viewports * FULLPAGE.pass.msPerViewport };
  });
};

/**
 * 천천히 재생할 구간에 시간을 더 주는 배분표. 구간 [from, to](이동 방향 순)를 slow 경계로 나눠 거리 × 배율을 누적한다.
 * weighted는 배율을 곱한 거리(px) — 도착 시간 계산에 쓴다.
 */
const weightedKnots = (
  from: number,
  to: number,
  range: { start: number; end: number },
  slow: ReadonlyArray<readonly [number, number, number]>,
): { knots: [number, number][]; weighted: number } => {
  const yOf = (p: number) => range.start + p * (range.end - range.start);
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  const ys = slow
    .flatMap(([p0, p1]) => [yOf(p0), yOf(p1)])
    .filter((y) => y > lo && y < hi)
    .concat(from, to)
    .sort((a, b) => (to > from ? a - b : b - a))
    .filter((y, index, list) => index === 0 || Math.abs(y - list[index - 1]) > 0.5);
  const weightAt = (y: number) => {
    const p = (y - range.start) / Math.max(1, range.end - range.start);
    return slow.find(([p0, p1]) => p > p0 && p < p1)?.[2] ?? 1;
  };
  const cumulative = [0];
  for (let i = 1; i < ys.length; i++) {
    cumulative.push(cumulative[i - 1] + Math.abs(ys[i] - ys[i - 1]) * weightAt((ys[i] + ys[i - 1]) / 2));
  }
  const weighted = cumulative[cumulative.length - 1];
  return { knots: ys.map((y, i) => [weighted > 0 ? cumulative[i] / weighted : 1, y]), weighted };
};

/** 배분표에서 시간 비율 u(0~1)의 scrollY */
const knotPosition = (knots: readonly (readonly [number, number])[], u: number): number => {
  for (let i = 1; i < knots.length; i++) {
    const [u0, y0] = knots[i - 1];
    const [u1, y1] = knots[i];
    if (u <= u1) return u1 - u0 <= 0 ? y1 : lerp(y0, y1, (u - u0) / (u1 - u0));
  }
  return knots[knots.length - 1][1];
};

/** 경과 시간(ms)의 스크롤 위치 — 0초 구간은 바로 건너뛰고, 구간마다 제 곡선(과 배분표)으로 보간한다 */
export const fullpagePlanPosition = (plan: readonly FullpageSegment[], elapsedMs: number): number => {
  if (plan.length === 0) return 0;
  let remaining = elapsedMs;
  for (const seg of plan) {
    if (remaining < seg.durationMs) {
      const u = easeOf(seg.kind)(remaining / seg.durationMs);
      return seg.knots ? knotPosition(seg.knots, u) : lerp(seg.from, seg.to, u);
    }
    remaining -= seg.durationMs;
  }
  return plan[plan.length - 1].to;
};

/** 경과 시간에 진행 중인 구간 종류(끝났으면 null) — 화면 이동(slide) 중에만 입력을 막는다 */
export const fullpagePlanKind = (
  plan: readonly FullpageSegment[],
  elapsedMs: number,
): FullpageSegmentKind | null => {
  let remaining = elapsedMs;
  for (const seg of plan) {
    if (remaining < seg.durationMs) return seg.kind;
    remaining -= seg.durationMs;
  }
  return null;
};

/** 전체 시간(ms) */
export const fullpagePlanDuration = (plan: readonly FullpageSegment[]): number =>
  plan.reduce((sum, seg) => sum + seg.durationMs, 0);

/**
 * 도착·떠나기 중 끼어든 입력의 목표: 같은 방향이면 진행 중인 목표의 다음 화면(지금 목표를 다시 잡으면 넘어가지 않으므로),
 * 반대 방향이거나 진행 중인 목표가 없으면 지금 위치 기준으로 방향에 있는 첫 화면.
 */
export const interruptedTarget = (
  stops: readonly FullpageStop[],
  scrollY: number,
  currentTarget: number | null,
  direction: number,
): number => {
  if (currentTarget == null) return nextFullpageIndex(stops, scrollY, direction);
  const isAhead =
    direction > 0 ? stops[currentTarget]?.scrollY > scrollY : stops[currentTarget]?.scrollY < scrollY;
  if (!isAhead) return nextFullpageIndex(stops, scrollY, direction);
  return clamp(currentTarget + direction, 0, stops.length - 1);
};

/** 관성 꼬리는 같은 제스처로 소비한다. 애니메이션 중 입력을 다음 이동으로 쌓지 않는다. */
export const consumeFullpageWheel = (
  previous: FullpageWheelGesture,
  time: number,
  deltaY: number,
  isAnimating: boolean,
): { gesture: FullpageWheelGesture; shouldAdvance: boolean } => {
  if (deltaY === 0) return { gesture: previous, shouldAdvance: false };
  const direction = Math.sign(deltaY);
  const isNew =
    previous.lastTime == null ||
    time - previous.lastTime >= FULLPAGE.gestureGapMs ||
    direction !== previous.direction;
  return { gesture: { lastTime: time, direction }, shouldAdvance: isNew && !isAnimating };
};
