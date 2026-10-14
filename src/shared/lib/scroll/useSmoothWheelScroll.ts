"use client";

import { useEffect } from "react";

import { SCROLL_STOP, SMOOTH_SCROLL, type SectionKey } from "@/shared/config";

import {
  addScrollTarget,
  firstStopCrossed,
  isStopReleased,
  scrollStopsPx,
  stepSmoothScroll,
  wheelDeltaPx,
} from "./smoothScroll";

/** 관성 스크롤 상태(페이지에 하나). 프레임마다 window.scrollTo만 쓰고 React 상태는 쓰지 않는다 */
const state = {
  isEnabled: false,
  isAnimating: false,
  current: 0,
  target: 0,
  lastWritten: 0,
  lastTime: null as number | null,
  rafId: null as number | null,
  /** 멈춤 지점(px, 오름차순) — 처음 쓸 때·리사이즈 때 [data-section]에서 잰다 */
  stops: null as number[] | null,
  /** 걸려 있는 멈춤 지점과 방향(1 아래, -1 위), 닿은 시각, 마지막 휠 시각, 흡수한 휠 양 */
  hold: null as {
    stop: number;
    dir: number;
    arrivedAt: number | null;
    lastWheelAt: number;
    absorbedPx: number;
  } | null,
};

const measureStops = (): number[] => {
  const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-section]")).map((node) => ({
    key: node.dataset.section as SectionKey,
    top: node.offsetTop,
    height: node.offsetHeight,
    end: node.offsetTop + node.offsetHeight,
  }));
  return scrollStopsPx(SCROLL_STOP.points, sections, window.innerHeight);
};

const maxScroll = (): number => document.documentElement.scrollHeight - window.innerHeight;

const stop = (): void => {
  state.hold = null;
  state.isAnimating = false;
  state.lastTime = null;
  if (state.rafId != null) cancelAnimationFrame(state.rafId);
  state.rafId = null;
};

const tick = (time: number): void => {
  state.rafId = null;
  const dt = state.lastTime == null ? 16 : Math.min(time - state.lastTime, 64);
  state.lastTime = time;
  const step = stepSmoothScroll(state.current, state.target, dt);
  state.current = step.current;
  window.scrollTo(0, state.current);
  state.lastWritten = window.scrollY;
  if (step.isDone) {
    const { hold } = state;
    stop();
    // 멈춤 지점에 닿았으면 그 시각부터 머문다(stop()이 지운 걸 되살린다)
    if (hold) state.hold = { ...hold, arrivedAt: hold.arrivedAt ?? time };
    return;
  }
  state.rafId = requestAnimationFrame(tick);
};

/**
 * 페이지를 delta(px)만큼 스크롤한다. 관성 스크롤이 켜져 있으면 목표만 옮기고 부드럽게 따라가며,
 * 꺼져 있으면(터치 전용·reduced motion) 바로 스크롤한다. 헤더가 휠을 먼저 가져간 뒤 남은 양도 이걸로 넘긴다.
 */
export const smoothScrollBy = (delta: number): void => {
  if (!state.isEnabled) {
    window.scrollBy(0, delta);
    return;
  }
  if (!state.isAnimating) {
    state.current = window.scrollY;
    state.target = window.scrollY;
    state.lastWritten = window.scrollY;
  }
  const now = performance.now();
  const dir = Math.sign(delta);
  // 멈춤 지점에 걸려 있으면 같은 방향 휠은 풀릴 때까지 흡수한다. 반대 방향이면 바로 풀린다
  if (state.hold) {
    const { hold } = state;
    const isReleased = dir !== hold.dir || isStopReleased({ ...hold, now }, window.innerHeight);
    if (!isReleased) {
      hold.lastWheelAt = now;
      hold.absorbedPx += Math.abs(delta);
      return;
    }
    state.hold = null;
  }
  state.stops ??= measureStops();
  let next = addScrollTarget(state.target, delta, maxScroll());
  const crossed = firstStopCrossed(state.target, next, state.stops);
  if (crossed != null) {
    next = crossed;
    state.hold = { stop: crossed, dir, arrivedAt: null, lastWheelAt: now, absorbedPx: 0 };
  }
  state.target = next;
  if (state.target === state.current) {
    if (state.hold) state.hold.arrivedAt ??= now;
    return;
  }
  state.isAnimating = true;
  if (state.rafId == null) state.rafId = requestAnimationFrame(tick);
};

/** 휠이 안쪽 스크롤 영역(팝오버 등)을 스크롤할 수 있으면 그쪽에 맡긴다 */
const canScrollInside = (target: EventTarget | null, deltaY: number): boolean => {
  let node = target instanceof Element ? target : null;
  while (node && node !== document.body && node !== document.documentElement) {
    const { overflowY } = window.getComputedStyle(node);
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) {
      const canMove =
        deltaY > 0 ? node.scrollTop + node.clientHeight < node.scrollHeight : node.scrollTop > 0;
      if (canMove) return true;
    }
    node = node.parentElement;
  }
  return false;
};

/**
 * 마우스 휠·트랙패드 스크롤을 관성 스크롤로 바꾼다(이슈 #43). 휠 한 번에 페이지가 뚝 점프하지 않고
 * 목표 위치를 반감기로 따라가 폰·문구·페이지가 함께 부드럽게 움직인다.
 * - 헤더가 휠을 먼저 가져가면(캡처 단계에서 preventDefault) 건드리지 않는다.
 * - 키보드·스크롤바처럼 다른 입력으로 스크롤되면 애니메이션을 멈추고 그 위치를 따른다.
 * - 터치는 기본 스크롤, reduced motion이면 켜지 않는다.
 * - 멈춤 지점(`SCROLL_STOP`)을 지나려 하면 그 자리에 세웠다가, 잠깐 머문 뒤 다시 굴리면 풀어 준다(팀 피드백).
 */
export const useSmoothWheelScroll = (): void => {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    state.isEnabled = true;

    const handleWheel = (event: WheelEvent) => {
      if (event.defaultPrevented || event.ctrlKey) return;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if (canScrollInside(event.target, event.deltaY)) return;
      event.preventDefault();
      smoothScrollBy(wheelDeltaPx(event, window.innerHeight));
    };

    const handleScroll = () => {
      // 키보드·스크롤바로 움직이면 애니메이션과 멈춤을 풀고 그 위치를 따른다
      if (Math.abs(window.scrollY - state.lastWritten) <= SMOOTH_SCROLL.externalJumpPx) return;
      if (state.isAnimating || state.hold) stop();
    };
    const handleResize = () => {
      state.stops = null;
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    return () => {
      state.isEnabled = false;
      state.stops = null;
      stop();
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);
};
