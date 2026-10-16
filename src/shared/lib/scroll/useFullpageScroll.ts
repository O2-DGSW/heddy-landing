"use client";

import { useEffect } from "react";

import { SECTION_KEYS, STAGE_LAYOUT } from "@/shared/config";

import {
  consumeFullpageWheel,
  fullpageDuration,
  fullpagePosition,
  fullpageStops,
  nextFullpageIndex,
  type FullpageWheelGesture,
} from "./fullpageScroll";
import { wheelDeltaPx } from "./smoothScroll";

let navigateToStop: ((index: number) => void) | null = null;

/** 점 내비게이션도 휠·키보드와 같은 컨트롤러로 이동한다. 모바일에서는 동작하지 않는다. */
export const scrollToFullpageStop = (index: number): void => navigateToStop?.(index);

/** 안쪽 스크롤·열린 팝오버·입력 요소의 기본 조작을 보존한다. */
const keepsNativeInput = (target: EventTarget | null, deltaY: number): boolean => {
  let node = target instanceof Element ? target : null;
  if (
    node?.closest(
      'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="dialog"], [data-native-scroll]',
    )
  )
    return true;
  while (node && node !== document.body && node !== document.documentElement) {
    const { overflowY } = window.getComputedStyle(node);
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) {
      if (deltaY > 0 ? node.scrollTop + node.clientHeight < node.scrollHeight - 1 : node.scrollTop > 0)
        return true;
    }
    node = node.parentElement;
  }
  return false;
};

/** 데스크톱에서만 한 제스처·한 키 입력을 한 완성 화면으로 바꾼다. 터치·스크롤바는 기본 스크롤이다. */
export const useFullpageScroll = (): void => {
  useEffect(() => {
    const desktop = window.matchMedia(`(min-width: ${STAGE_LAYOUT.desktop.breakpoint}px)`);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let rafId: number | null = null;
    let gesture: FullpageWheelGesture = { lastTime: null, direction: 0 };

    const measureStops = () => {
      const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-section]")).flatMap(
        (node) => {
          const key = SECTION_KEYS.find((candidate) => candidate === node.dataset.section);
          if (!key || node.offsetHeight === 0) return [];
          const top = node.getBoundingClientRect().top + window.scrollY;
          return [{ key, top, height: node.offsetHeight, end: top + node.offsetHeight }];
        },
      );
      return fullpageStops(
        sections,
        window.innerHeight,
        document.documentElement.scrollHeight - window.innerHeight,
      );
    };

    const stop = () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      rafId = null;
    };

    const moveTo = (index: number) => {
      if (!desktop.matches) return;
      const target = measureStops()[index];
      if (!target) return;
      stop();
      const from = window.scrollY;
      const to = target.scrollY;
      if (Math.abs(to - from) < 1) return;
      if (reduced.matches) {
        window.scrollTo({ top: to, behavior: "instant" });
        return;
      }
      const duration = fullpageDuration();
      let startTime: number | null = null;
      const tick = (time: number) => {
        startTime ??= time;
        const elapsed = time - startTime;
        window.scrollTo({ top: fullpagePosition(from, to, elapsed, duration), behavior: "instant" });
        rafId = elapsed < duration ? requestAnimationFrame(tick) : null;
      };
      rafId = requestAnimationFrame(tick);
    };

    const moveBy = (direction: number) =>
      moveTo(nextFullpageIndex(measureStops(), window.scrollY, direction));

    const handleWheel = (event: WheelEvent) => {
      if (
        !desktop.matches ||
        event.defaultPrevented ||
        event.ctrlKey ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY) ||
        event.deltaY === 0
      )
        return;
      if (keepsNativeInput(event.target, event.deltaY)) return;
      event.preventDefault();
      const result = consumeFullpageWheel(
        gesture,
        performance.now(),
        wheelDeltaPx(event, window.innerHeight),
        rafId != null,
      );
      gesture = result.gesture;
      if (result.shouldAdvance) moveBy(Math.sign(event.deltaY));
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!desktop.matches || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey)
        return;
      if (keepsNativeInput(event.target, 0)) return;
      if (
        event.key === " " &&
        event.target instanceof Element &&
        event.target.closest("button, a, [role=button]")
      )
        return;
      let direction = 0;
      if (["ArrowDown", "PageDown"].includes(event.key)) direction = 1;
      if (["ArrowUp", "PageUp"].includes(event.key)) direction = -1;
      if (event.key === " ") direction = event.shiftKey ? -1 : 1;
      if (!direction && !["Home", "End"].includes(event.key)) return;
      event.preventDefault();
      if (event.repeat || rafId != null) return;
      gesture = { lastTime: performance.now(), direction };
      if (event.key === "Home") moveTo(0);
      else if (event.key === "End") moveTo(measureStops().length - 1);
      else moveBy(direction);
    };

    const handleResize = () => {
      stop();
      gesture = { lastTime: null, direction: 0 };
    };
    const handleTouchStart = () => stop();
    // 미세한 브라우저 스크롤 보정으로 취소하지 않는다. 명시적 포인터·터치 조작으로만 중단한다.
    const handlePointerDown = () => {
      if (desktop.matches) stop();
    };

    navigateToStop = moveTo;
    window.addEventListener("wheel", handleWheel, { passive: false, capture: true });
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("resize", handleResize);
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    desktop.addEventListener("change", handleResize);
    reduced.addEventListener("change", handleResize);
    return () => {
      stop();
      if (navigateToStop === moveTo) navigateToStop = null;
      window.removeEventListener("wheel", handleWheel, { capture: true });
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("touchstart", handleTouchStart);
      desktop.removeEventListener("change", handleResize);
      reduced.removeEventListener("change", handleResize);
    };
  }, []);
};
