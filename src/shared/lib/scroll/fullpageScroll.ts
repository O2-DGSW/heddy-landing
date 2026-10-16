import { FULLPAGE, type SectionKey } from "@/shared/config";
import { clamp, easeInOutCubic, lerp } from "@/shared/lib/motion";

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

/** 섹션의 모션용 스크롤 길이에 관계없이 같은 시간에 다음 완성 화면으로 이동한다. */
export const fullpageDuration = (): number => FULLPAGE.durationMs;

/** 프레임 간격과 무관하게 정해진 시간에 도착하며 중간 스크롤 모션도 재생한다. */
export const fullpagePosition = (from: number, to: number, elapsedMs: number, durationMs: number): number =>
  durationMs <= 0 ? to : lerp(from, to, easeInOutCubic(clamp(elapsedMs / durationMs)));

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
