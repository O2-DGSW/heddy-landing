"use client";

import { useEffect } from "react";

import { SMOOTH_SCROLL } from "@/shared/config";

import { addScrollTarget, stepSmoothScroll, wheelDeltaPx } from "./smoothScroll";

/** 관성 스크롤 상태(페이지에 하나). 프레임마다 window.scrollTo만 쓰고 React 상태는 쓰지 않는다 */
const state = {
  isEnabled: false,
  isAnimating: false,
  current: 0,
  target: 0,
  lastWritten: 0,
  lastTime: null as number | null,
  rafId: null as number | null,
};

const maxScroll = (): number => document.documentElement.scrollHeight - window.innerHeight;

const stop = (): void => {
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
    stop();
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
  state.target = addScrollTarget(state.target, delta, maxScroll());
  if (state.target === state.current) return;
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
      if (!state.isAnimating) return;
      if (Math.abs(window.scrollY - state.lastWritten) > SMOOTH_SCROLL.externalJumpPx) stop();
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      state.isEnabled = false;
      stop();
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
};
